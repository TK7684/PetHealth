/**
 * PetHealth nightly digest — standalone cron entrypoint.
 * Reads the local SQLite mirror (local D1 stand-in), gathers last-24h data
 * for every pet, calls ZAI glm-4.5-flash (failover llama3.2:3b), persists
 * the Thai digest to ai_insights, prints it.
 *
 * Run: npx tsx scripts/ai-digest.ts
 * DB: .local-data/pethealth.db (auto-created from drizzle/d1_schema.sql,
 *     seeded with TK + Luca from drizzle/seed_tk_luca.sql on first run)
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc, gte } from "drizzle-orm";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  users, pets, memos, aiInsights, weightRecords, dailyActivities, feedingSchedules,
} from "../drizzle/schema";
import { buildPetContext, buildDigestPrompt, callZaiFlash } from "../server/_core/ai";

// ---- Load GLM_API_KEY (and friends) from ~/.hermes/.env ----
try {
  const env = readFileSync(process.env.HOME + "/.hermes/.env", "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("[digest] no ~/.hermes/.env found — ZAI will fail over to Ollama");
}

// ---- Local DB mirror (D1 stand-in until remote D1 exists) ----
const DATA_DIR = path.resolve(import.meta.dirname ?? ".", "../.local-data");
const DB_PATH = path.join(DATA_DIR, "pethealth.db");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const firstRun = !existsSync(DB_PATH);
const sqlite = new Database(DB_PATH);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec(readFileSync(path.resolve(import.meta.dirname ?? ".", "../drizzle/d1_schema.sql"), "utf-8"));
if (firstRun) {
  sqlite.exec(readFileSync(path.resolve(import.meta.dirname ?? ".", "../drizzle/seed_tk_luca.sql"), "utf-8"));
  console.log("[digest] first run — schema applied, TK+Luca seeded");
}

const db = drizzle(sqlite, {
  schema: { users, pets, memos, aiInsights, weightRecords, dailyActivities, feedingSchedules },
});

async function main() {
  const allPets = await db.select().from(pets);
  if (allPets.length === 0) {
    console.log("[digest] no pets in local DB — nothing to summarize");
    return;
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const inWindow = (d: Date | null) => d !== null && new Date(d).getTime() >= since.getTime();

  for (const pet of allPets) {
    // Dedupe: skip if a digest for this pet already exists today
    const latest = await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.petId, pet.id))
      .orderBy(desc(aiInsights.insightDate))
      .limit(1);
    if (latest[0] && latest[0].type === "daily_digest" && inWindow(latest[0].insightDate)) {
      console.log(`[digest] ${pet.name}: today's digest already exists (id ${latest[0].id}) — skipping`);
      continue;
    }

    // Gather last-24h data
    const [acts, petMemos, weights, feedings] = await Promise.all([
      db.select().from(dailyActivities).where(eq(dailyActivities.petId, pet.id)).orderBy(desc(dailyActivities.date)).limit(20),
      db.select().from(memos).where(eq(memos.petId, pet.id)).orderBy(desc(memos.memoDate)).limit(20),
      db.select().from(weightRecords).where(eq(weightRecords.petId, pet.id)).orderBy(desc(weightRecords.date)).limit(5),
      db.select().from(feedingSchedules).where(eq(feedingSchedules.petId, pet.id)),
    ]);

    const dayParts: string[] = [];
    const todayActs = acts.filter(a => inWindow(a.date));
    dayParts.push(todayActs.length
      ? `กิจกรรม: ${todayActs.map(a => `${a.activityType}${a.duration ? ` ${a.duration}นาที` : ""}`).join(", ")}`
      : "กิจกรรม: ไม่มีบันทึกวันนี้");
    const todayMemos = petMemos.filter(m => inWindow(m.memoDate));
    if (todayMemos.length) dayParts.push(`บันทึก: ${todayMemos.map(m => m.content.slice(0, 80)).join(" | ")}`);
    const todayWeight = weights.find(w => inWindow(w.date));
    if (todayWeight) dayParts.push(`น้ำหนักวันนี้: ${todayWeight.weight}kg`);
    if (feedings.length) dayParts.push(`ตารางอาหาร: ${feedings.map(f => `${f.foodType} ${f.time ?? ""}`).join(", ")}`);

    const ctx = buildPetContext({ pet });
    const { text, provider } = await callZaiFlash(buildDigestPrompt(ctx, dayParts.join("\n")), { maxTokens: 1500 });

    const [insight] = await db.insert(aiInsights).values({
      petId: pet.id,
      type: "daily_digest",
      severity: "info",
      title: `สรุปสุขภาพวันนี้ — ${new Date().toLocaleDateString("th-TH")}`,
      body: text,
      evidenceJson: JSON.stringify({ activities: todayActs.length, memos: todayMemos.length, provider, source: "cron" }),
      insightDate: new Date(),
    }).returning();

    console.log(`\n🐾 ${pet.name} — digest saved (id ${insight.id}, provider ${provider})`);
    console.log(text);
  }
}

main()
  .then(() => { sqlite.close(); process.exit(0); })
  .catch(err => { console.error("[digest] FAILED:", err.message); sqlite.close(); process.exit(1); });
