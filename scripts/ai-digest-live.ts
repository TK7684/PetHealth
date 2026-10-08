/**
 * Live AI smoke test — real ZAI glm-4.5-flash call for Luca's digest.
 * Run: npx tsx scripts/ai-digest-live.ts
 * Loads GLM_API_KEY from ~/.hermes/.env
 */
import { readFileSync } from "node:fs";

// Load env
try {
  const env = readFileSync(process.env.HOME + "/.hermes/.env", "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const { callZaiFlash, buildPetContext, buildDigestPrompt } = await import("../server/_core/ai");

console.log("🐾 Luca live digest test — ZAI glm-4.5-flash\n");

const ctx = buildPetContext({
  pet: { name: "Luca", breed: null, gender: "unknown", birthDate: null },
  feedingSchedules: [{ foodType: "standard", time: "18:00", frequency: "daily" }],
});

const dayData = [
  "กิจกรรม: เดินเล่น 30 นาที (เช้า), เดินเล่น 25 นาที (เย็น)",
  "บันทึก: กินข้าวหมดจาน เล่นเอาทุกวัน น่ารักมาก",
  "น้ำหนักวันนี้: ไม่มีการชั่ง",
  "ตารางอาหาร: standard 18:00 (daily)",
].join("\n");

const t0 = Date.now();
try {
  const { text, provider } = await callZaiFlash(buildDigestPrompt(ctx, dayData), { maxTokens: 2000 });
  const ms = Date.now() - t0;
  console.log(`✅ Provider: ${provider} | Latency: ${ms}ms\n`);
  console.log("─── Luca's digest tonight ───");
  console.log(text);
  console.log("───");
  process.exit(0);
} catch (err) {
  console.error("❌ AI call failed:", (err as Error).message);
  process.exit(1);
}
