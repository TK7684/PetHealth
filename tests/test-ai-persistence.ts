/**
 * AI persistence E2E — memos + insights CRUD against local SQLite with new schema.
 * Run: npx tsx tests/test-ai-persistence.ts
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc } from "drizzle-orm";
import { memos, aiInsights, users, pets } from "../drizzle/schema";
import { readFileSync } from "node:fs";

const dbPath = "/tmp/pethealth-ai-persist.db";
try { (await import("node:fs")).unlinkSync(dbPath); } catch {}

const sqlite = new Database(dbPath);
sqlite.exec(readFileSync("./drizzle/d1_schema.sql", "utf-8"));
const db = drizzle(sqlite, { schema: { memos, aiInsights, users, pets } });

let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${detail}`); }
}

console.log("\n🧪 AI Persistence E2E\n");

// Setup user + pet
const [user] = await db.insert(users).values({ openId: "t1", email: "t@t.co", name: "T" }).returning();
const [pet] = await db.insert(pets).values({ userId: user.id, name: "Luca" }).returning();

// Memo lifecycle
console.log("1. Memo lifecycle");
const [memo] = await db.insert(memos).values({ petId: pet.id, content: "วันนี้ขี้อ้อนผิดปกติ", source: "voice", memoDate: new Date() }).returning();
check("Create memo", !!memo && memo.id > 0);
check("Voice source saved", memo.source === "voice");
const memoList = await db.select().from(memos).where(eq(memos.petId, pet.id)).orderBy(desc(memos.memoDate));
check("List memos by pet", memoList.length === 1);
await db.delete(memos).where(eq(memos.id, memo.id));
const after = await db.select().from(memos).where(eq(memos.petId, pet.id));
check("Delete memo", after.length === 0);

// Insight lifecycle
console.log("\n2. Insight lifecycle");
const [insight] = await db.insert(aiInsights).values({
  petId: pet.id,
  type: "daily_digest",
  severity: "green",
  title: "สรุปวันนี้",
  body: "กินหมดจาน เดิน 55 นาที ปกติดี",
  evidenceJson: JSON.stringify({ activities: 2, provider: "zai" }),
  insightDate: new Date(),
}).returning();
check("Create insight", !!insight && insight.id > 0);
check("Severity green saved", insight.severity === "green");

insight.status = "acknowledged";
await db.update(aiInsights).set({ status: "acknowledged" }).where(eq(aiInsights.id, insight.id));
const [acked] = await db.select().from(aiInsights).where(eq(aiInsights.id, insight.id));
check("Acknowledge insight", acked.status === "acknowledged");

const [cluster] = await db.insert(aiInsights).values({
  petId: pet.id,
  type: "cluster_alert",
  severity: "amber",
  title: "ตรวจพบ 3 จุด",
  body: "activity+weight+behavior",
  evidenceJson: JSON.stringify({ anomalies: ["a1", "a2", "a3"] }),
  insightDate: new Date(),
}).returning();
const all = await db.select().from(aiInsights).where(eq(aiInsights.petId, pet.id)).orderBy(desc(aiInsights.id));
check("List insights newest first", all.length === 2 && all[0].id === cluster.id);
check("Evidence JSON round-trips", JSON.parse(cluster.evidenceJson!).anomalies.length === 3);

// Cleanup
await db.delete(aiInsights).where(eq(aiInsights.petId, pet.id));
await db.delete(pets).where(eq(pets.id, pet.id));
await db.delete(users).where(eq(users.id, user.id));

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(40)}\n`);
sqlite.close();
process.exit(fail > 0 ? 1 : 0);
