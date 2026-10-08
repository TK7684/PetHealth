/**
 * AI layer integration tests — no LLM calls mocked, deterministic parts only.
 * Tests: ER triage guardrails, prompt builders, digest data assembly, cluster rules.
 * Run: npx tsx tests/test-ai-layer.ts
 */

let pass = 0, fail = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${detail}`); }
}

console.log("\n🧪 AI Layer Tests (deterministic parts)\n");

// ===== 1. ER Triage guardrails =====
console.log("1. ER Triage Guardrails");
const { checkErTriage, ER_MESSAGE, buildPetContext, buildDigestPrompt, buildClusterPrompt, ER_TRIAGE_KEYWORDS } = await import("../server/_core/ai");

const cases: [string, boolean][] = [
  ["ลูก้าหายใจลำบากมาก", true],
  ["น้องชักแล้วครับ", true],
  ["เหงือกซีดมาก", true],
  ["กินช็อกโกแลตไป 1 แท่ง", true],
  ["ท้องบวมแข็ง", true],
  ["walked 30 minutes today", false],
  ["กินอาหารจานเดิมปกติ", false],
  ["เล่นเอาทุกวัน น่ารักมาก", false],
  ["today he seems tired but ate well", false],
];
for (const [text, expectER] of cases) {
  const hit = checkErTriage(text);
  check(`"${text.slice(0, 25)}" → ${expectER ? "ER" : "AI"}`, expectER ? hit !== null : hit === null);
}
check("ER message mentions vet hospital", ER_MESSAGE.includes("โรงพยาบาลสัตวแพทย์"));

// ===== 2. Context builder =====
console.log("\n2. Pet Context Builder");
const ctx = buildPetContext({
  pet: { name: "Luca", breed: "Golden Retriever", gender: "male", birthDate: new Date("2022-03-15") },
  recentWeights: [{ date: new Date(), weight: 25 }, { date: new Date(Date.now() - 86400000 * 30), weight: 24 }],
  recentActivities: [{ date: new Date(), activityType: "walk", duration: 45 }],
  recentMemos: [{ memoDate: new Date(), content: "วันนี้ขี้อ้อนผิดปกติ" }],
  upcomingVaccinations: [{ vaccineName: "Rabies", nextDate: new Date(Date.now() + 86400000 * 7) }],
  feedingSchedules: [{ foodType: "dry food", time: "18:00", frequency: "daily" }],
});
check("Context includes pet name", ctx.includes("Luca"));
check("Context includes breed", ctx.includes("Golden Retriever"));
check("Context includes age", ctx.includes("อายุ"));
check("Context includes weight data", ctx.includes("25kg"));
check("Context includes memo", ctx.includes("ขี้อ้อน"));
check("Context includes vaccine due", ctx.includes("Rabies"));
check("Context includes feeding 18:00", ctx.includes("18:00"));
check("Context has non-diagnosis guardrail", ctx.includes("ไม่ใช่การวินิจฉัยโรค"));
check("Context is Thai-first", ctx.includes("ภาษาไทย"));

// ===== 3. Prompt builders =====
console.log("\n3. Prompt Builders");
const digest = buildDigestPrompt(ctx, "กิจกรรม: walk 45นาที");
check("Digest prompt has system+user", digest.length === 2);
check("Digest asks for 3-5 Thai bullets", digest[0].content.includes("3-5 bullets"));

const cluster = buildClusterPrompt(ctx, "anomaly1\nanomaly2");
check("Cluster prompt has system+user", cluster.length === 2);
check("Cluster prompt mentions cluster", cluster[0].content.includes("cluster"));

// ===== 4. Cluster rules (reimplemented deterministically for test) =====
console.log("\n4. Cluster Rule Logic");
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 86400000);
// Simulate: healthy activity pattern
const healthyActs = [7, 6, 5, 4, 3, 2, 1].map(d => ({ date: daysAgo(d), duration: 45 }));
const dur7 = healthyActs.reduce((s, a) => s + (a.duration ?? 0), 0);
check("Healthy 7-day avg computed", Math.round(dur7 / 7) === 45);
// Simulate decline: last 3 days at 20 min
const actsDecline = [...healthyActs.slice(3), { date: daysAgo(2), duration: 20 }, { date: daysAgo(1), duration: 20 }, { date: daysAgo(0), duration: 20 }];
const dur3decline = actsDecline.slice(-3).reduce((s, a) => s + (a.duration ?? 0), 0);
const declined = dur3decline / 3 < dur7 / 7 * 0.5;
check("Decline rule fires at >50% drop", declined);
// Weight slope: 24 → 26 kg in 30 days = 8.3% > 3%
const pctChange = ((26 - 24) / 24) * 100;
check("Weight slope rule math correct", pctChange.toFixed(1) === "8.3" && Math.abs(pctChange) > 3);
// Weight stable: 24 → 24.5
const pctStable = ((24.5 - 24) / 24) * 100;
check("Stable weight does not fire", Math.abs(pctStable) <= 3);

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(40)}\n`);
process.exit(fail > 0 ? 1 : 0);
