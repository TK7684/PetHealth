/**
 * AI layer for PetHealth — ZAI glm-flash primary, llama3.2:3b (Ollama) failover.
 * Follows fleet-ratified pattern (2026-10-08): ZAI primary day+night, local failover on 429/outage.
 * All prompts output Thai. ER-triage guardrails hard-coded.
 */

const ZAI_API_URL = "https://api.z.ai/api/paas/v4/chat/completions";

// Emergency triage — always route to vet, never AI-answer these
export const ER_TRIAGE_KEYWORDS = [
  "หายใจลำบาก", "หายใจแรง", "หอบ",
  "เหงือกซีด", "เหงือกขาว", "เหงือกฟ้า",
  "ชัก", "ซึมผิดปกติมาก", "หมดสติ",
  "ท้องบวมแข็ง", "จุกเสียดแน่นท้องมาก",
  "กินยาพิษ", "กินช็อกโกแลต", "กินองุ่น", "กินไซลิทอล",
  "เลือดไหลไม่หยุด", "กระดูกหัก", "อุบัติเหตุ",
  "bloat", "seizure", "collapse", "pale gums", "poison",
];

export function checkErTriage(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of ER_TRIAGE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      return kw;
    }
  }
  return null;
}

export const ER_MESSAGE = `🚨 อาการที่คุณบอกอาจเป็น**ภาวะฉุกเฉิน** — พาน้องไปโรงพยาบาลสัตวแพทย์ทันที ไม่ต้องรอคำแนะนำจากแอป
(อาการกลุ่มนี้: หายใจลำบาก เหงือกซีด/ฟ้า ชัก ท้องบวมแข็ง กินสิ่งมีพิษ เลือดไหลไม่หยุด อุบัติเหตุ)`;

function getZaiKey(): string | null {
  try {
    // Workers: secret binding; Node: env
    const env = (globalThis as any)?.process?.env ?? {};
    return env.GLM_API_KEY || env.ZAI_API_KEY || null;
  } catch {
    return null;
  }
}

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

/** Call ZAI glm-4.5-flash; failover to local llama3.2:3b on any failure. */
export async function callZaiFlash(
  messages: AiMessage[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<{ text: string; provider: "zai" | "ollama" }> {
  const key = getZaiKey();
  if (key) {
    try {
      const res = await fetch(ZAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "glm-4.5-flash",
          messages,
          max_tokens: opts.maxTokens ?? 1200,
          temperature: opts.temperature ?? 0.4,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const data: any = await res.json();
        const choice = data?.choices?.[0];
        const msg = choice?.message;
        // glm-4.5-flash is a reasoning model: content may be empty with the
        // answer in reasoning_content when max_tokens is exhausted by thinking
        const text = (msg?.content && String(msg.content).trim()) || (msg?.reasoning_content && String(msg.reasoning_content).trim()) || "";
        if (text) return { text, provider: "zai" };
      }
      console.warn(`[AI] ZAI failed (${res.status}), falling back to Ollama`);
    } catch (err) {
      console.warn("[AI] ZAI error, falling back to Ollama:", String(err));
    }
  }

  // Failover: local Ollama llama3.2:3b (FLEET endpoint, 0 baht cost)
  const ollamaUrl = (globalThis as any)?.process?.env?.OLLAMA_URL || "http://localhost:11434";
  const res = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:3b",
      messages,
      stream: false,
      options: { temperature: opts.temperature ?? 0.4, num_predict: opts.maxTokens ?? 1200 },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`Both ZAI and Ollama failed (ollama ${res.status})`);
  const data: any = await res.json();
  const text = data?.message?.content;
  if (!text) throw new Error("Ollama returned empty response");
  return { text, provider: "ollama" };
}

export type PetContextData = {
  pet: { name: string; breed?: string | null; gender?: string | null; birthDate?: Date | null };
  recentWeights?: { date: Date; weight: number }[];
  recentActivities?: { date: Date; activityType: string; duration?: number | null }[];
  recentMemos?: { memoDate: Date; content: string }[];
  recentHealthRecords?: { date: Date; recordType: string; notes?: string | null }[];
  upcomingVaccinations?: { vaccineName: string; nextDate?: Date | null }[];
  upcomingMedications?: { medicationName: string; nextDueDate?: Date | null }[];
  feedingSchedules?: { foodType: string; time?: string | null; frequency: string }[];
};

/** Build the Thai system prompt with the pet's full profile context. */
export function buildPetContext(data: PetContextData): string {
  const { pet } = data;
  const ageYears = pet.birthDate
    ? Math.floor((Date.now() - new Date(pet.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const lines: string[] = [
    "คุณค่าผู้ช่วยดูแลสุขภาพสัตว์เลี้ยงในแอป PetHealth ตอบเป็นภาษาไทย สั้น กระชับ อบอุ่น",
    "ข้อจำกัดสำคัญ: คุณให้คำแนะนำเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยโรค — ถ้าอาการน่ากังวลให้แนะนำพบสัตวแพทย์",
    "",
    `ข้อมูลน้อง: ชื่อ ${pet.name}`,
  ];
  if (pet.breed) lines.push(`- พันธุ์: ${pet.breed}`);
  if (ageYears !== null) lines.push(`- อายุ: ~${ageYears} ปี`);
  if (pet.gender && pet.gender !== "unknown") lines.push(`- เพศ: ${pet.gender === "male" ? "ผู้" : "เมีย"}`);

  if (data.recentWeights?.length) {
    const w = data.recentWeights.slice(0, 5).map(r => `${new Date(r.date).toLocaleDateString("th-TH")} = ${r.weight}kg`);
    lines.push(`- น้ำหนักล่าสุด: ${w.join(", ")}`);
  }
  if (data.recentActivities?.length) {
    const acts = data.recentActivities.slice(0, 5).map(a => `${a.activityType}${a.duration ? ` ${a.duration}นาที` : ""}`);
    lines.push(`- กิจกรรมล่าสุด: ${acts.join(", ")}`);
  }
  if (data.recentMemos?.length) {
    const m = data.recentMemos.slice(0, 5).map(r => `${new Date(r.memoDate).toLocaleDateString("th-TH")}: ${r.content.slice(0, 100)}`);
    lines.push(`- บันทึกล่าสุด: ${m.join(" | ")}`);
  }
  if (data.recentHealthRecords?.length) {
    const h = data.recentHealthRecords.slice(0, 3).map(r => `${r.recordType} (${new Date(r.date).toLocaleDateString("th-TH")})`);
    lines.push(`- ประวัติสุขภาพล่าสุด: ${h.join(", ")}`);
  }
  if (data.upcomingVaccinations?.length) {
    const v = data.upcomingVaccinations.filter(x => x.nextDate).map(x => `${x.vaccineName} วันที่ ${new Date(x.nextDate!).toLocaleDateString("th-TH")}`);
    if (v.length) lines.push(`- วัคซีนจะถึงคิว: ${v.join(", ")}`);
  }
  if (data.upcomingMedications?.length) {
    const m = data.upcomingMedications.filter(x => x.nextDueDate).map(x => `${x.medicationName} วันที่ ${new Date(x.nextDueDate!).toLocaleDateString("th-TH")}`);
    if (m.length) lines.push(`- ยาจะถึงคิว: ${m.join(", ")}`);
  }
  if (data.feedingSchedules?.length) {
    const f = data.feedingSchedules.map(x => `${x.foodType} ${x.time ?? ""} (${x.frequency})`);
    lines.push(`- ตารางอาหาร: ${f.join(", ")}`);
  }

  return lines.join("\n");
}

/** Nightly digest prompt — last 24h summary */
export function buildDigestPrompt(ctx: string, dayData: string): AiMessage[] {
  return [
    { role: "system", content: `${ctx}\n\nวันนี้คุณจะสรุปสุขภาพประจำวันของน้องแบบสั้นๆ 3-5 bullets ภาษาไทย ใช้ emoji เล็กน้อย ถ้าทุกอย่างปกติให้บอกว่าปกติ ถ้ามีอะไรน่าจับตาให้ระบุชัด` },
    { role: "user", content: `ข้อมูลวันนี้ของน้อง:\n${dayData}\n\nสรุปสุขภาพวันนี้:` },
  ];
}

/** Cluster alert prompt — fired when ≥3 metrics deviate */
export function buildClusterPrompt(ctx: string, evidence: string): AiMessage[] {
  return [
    { role: "system", content: `${ctx}\n\nตอนนี้ระบบตรวจพบความผิดปกติหลายอย่างพร้อมกัน (cluster) เขียนแจ้งเตือนภาษาไทย: สิ่งที่สังเกตเห็น, อาจเกี่ยวกับอะไรบ้าง (ให้ความรู้ ไม่วินิจฉัย), ควรสังเกตอะไรต่อ, เมื่อไรควรพบสัตวแพทย์ จำกัด 5 bullets` },
    { role: "user", content: `หลักฐานความผิดปกติ:\n${evidence}\n\nเขียนแจ้งเตือน:` },
  ];
}
