/**
 * AGI experiment: dead-code activation — server/_core/voiceTranscription.ts was
 * a complete Whisper client with zero callers. This test pins the activation
 * contract, mirroring ai-router.test.ts:
 * 1. transcribeAudio fails closed when no API key is configured
 * 2. The new voice.transcribe seam exists on the app router
 */
import { describe, expect, it, beforeAll } from "vitest";

describe("voice router activation (dead-code activation pattern)", () => {
  beforeAll(() => {
    delete process.env.BUILT_IN_FORGE_API_URL;
  });

  it("transcribeAudio fails closed without an API key", async () => {
    const { transcribeAudio } = await import("./_core/voiceTranscription");
    const result = await transcribeAudio({ audioUrl: "https://example.com/a.mp3" });
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.code).toBe("SERVICE_ERROR");
      expect(result.details).toMatch(/BUILT_IN_FORGE_API_URL/);
    }
  });

  it("app router exposes the voice.transcribe seam", async () => {
    const mod = await import("./routers");
    const router = mod.appRouter as unknown as Record<string, unknown>;
    expect(router).toBeTruthy();
    expect(router._def).toBeTruthy();
    const procedures = (router._def as { procedures: Record<string, unknown> }).procedures;
    expect(Object.keys(procedures)).toContain("voice.transcribe");
  });
});
