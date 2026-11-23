/**
 * AGI experiment 2026-11-23: evidence gate at the release seam.
 * Pattern transfer from trading-agents (ledger-backed downgrades where
 * decisions are RELEASED) + hermes/agi_system (route by realized outcomes,
 * degenerate to legacy when the ledger is empty).
 *
 * Contract:
 * 1. Empty ledger -> legacy routing: ZAI attempted first (static prior preserved).
 * 2. Sustained ZAI outage -> breaker opens: released answers skip ZAI entirely
 *    (0 ZAI attempts once open) and fail open to Ollama.
 * 3. Cooldown expiry -> half-open probe re-attempts ZAI (recovery path).
 */
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

const ZAI = "https://api.z.ai/api/paas/v4/chat/completions";
const OLLAMA = "http://localhost:11434/api/chat";

type FetchLog = { urls: string[] };

function stubFetch(zaiStatus: number): FetchLog {
  const log: FetchLog = { urls: [] };
  const impl = async (url: unknown): Promise<any> => {
    const u = String(url);
    log.urls.push(u);
    if (u.startsWith("https://api.z.ai")) {
      return {
        ok: zaiStatus >= 200 && zaiStatus < 300,
        status: zaiStatus,
        json: async () => ({ choices: [{ message: { content: "คำตอบจาก zai" } }] }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ message: { content: "คำตอบจาก ollama" } }),
    };
  };
  vi.stubGlobal("fetch", vi.fn(impl));
  return log;
}

const MSGS = [{ role: "user" as const, content: "น้องกินข้าวน้อยลง" }];

describe("AI evidence gate at the release seam", () => {
  let mod: typeof import("./_core/ai");

  beforeEach(async () => {
    process.env.GLM_API_KEY = "test-key";
    delete process.env.OLLAMA_URL;
    mod = await import("./_core/ai");
    mod._resetZaiBreakerForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.GLM_API_KEY;
  });

  it("empty ledger keeps legacy routing: ZAI attempted first", async () => {
    const log = stubFetch(200);
    const res = await mod.callZaiFlash(MSGS);
    expect(res.provider).toBe("zai");
    expect(log.urls[0]).toBe(ZAI);
  });

  it("sustained outage opens the breaker: fail-open with zero ZAI attempts", async () => {
    const log = stubFetch(500);
    // 4 consecutive failures = threshold -> circuit opens
    for (let i = 0; i < 4; i++) {
      const res = await mod.callZaiFlash(MSGS);
      expect(res.provider).toBe("ollama");
    }
    expect(log.urls.filter(u => u === ZAI).length).toBe(4);
    // 5th released answer: breaker is open -> ZAI never even attempted
    const res = await mod.callZaiFlash(MSGS);
    expect(res.provider).toBe("ollama");
    expect(log.urls.filter(u => u === ZAI).length).toBe(4); // unchanged: 0 new ZAI attempts
    expect(log.urls.filter(u => u === OLLAMA).length).toBe(5);
  });

  it("cooldown expiry half-open probes ZAI again (recovery)", async () => {
    const log = stubFetch(500);
    for (let i = 0; i < 4; i++) await mod.callZaiFlash(MSGS);
    expect(log.urls.filter(u => u === ZAI).length).toBe(4);
    // Advance past the 60s cooldown
    const realNow = Date.now.bind(Date);
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + 61_000);
    const probe = await mod.callZaiFlash(MSGS);
    expect(probe.provider).toBe("ollama"); // ZAI still down at probe time
    expect(log.urls.filter(u => u === ZAI).length).toBe(5); // probe attempted
    // Probe failed while already at threshold -> circuit re-opens
    const skipped = await mod.callZaiFlash(MSGS);
    expect(skipped.provider).toBe("ollama");
    expect(log.urls.filter(u => u === ZAI).length).toBe(5); // no further attempts
  });

  it("ZAI recovery closes the breaker", async () => {
    const log = stubFetch(500);
    for (let i = 0; i < 4; i++) await mod.callZaiFlash(MSGS);
    // ZAI comes back after cooldown
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    const log2 = stubFetch(200);
    const realNow = Date.now.bind(Date);
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + 61_000);
    const res = await mod.callZaiFlash(MSGS);
    expect(res.provider).toBe("zai"); // half-open probe succeeds
    // Breaker closed -> next call goes straight to ZAI again
    vi.spyOn(Date, "now").mockImplementation(() => realNow() + 62_000);
    const res2 = await mod.callZaiFlash(MSGS);
    expect(res2.provider).toBe("zai");
    expect(log2.urls.filter(u => u === OLLAMA).length).toBe(0);
    expect(log.urls).toBeTruthy(); // silence unused warning
  });
});
