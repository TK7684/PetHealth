/**
 * AGI experiment: dead-code activation — server/_core/llm.ts was a complete
 * LLM client with zero callers. This test pins the activation contract:
 * 1. invokeLLM fails closed when no API key is configured (absent-key behavior preserved)
 * 2. The new ai.dailySummary seam exists on the app router
 */
import { describe, expect, it, beforeAll } from "vitest";

describe("ai router activation (dead-code activation pattern)", () => {
  beforeAll(() => {
    delete process.env.BUILT_IN_FORGE_API_URL;
  });

  it("invokeLLM fails closed without an API key", async () => {
    const { invokeLLM } = await import("./_core/llm");
    await expect(
      invokeLLM({ messages: [{ role: "user", content: "hi" }] })
    ).rejects.toThrow(/OPENAI_API_KEY is not configured/);
  });

  it("app router exposes the ai.dailySummary seam", async () => {
    const mod = await import("./routers");
    const router = mod.appRouter as unknown as Record<string, unknown>;
    expect(router).toBeTruthy();
    expect(router._def).toBeTruthy();
    const procedures = (router._def as { procedures: Record<string, unknown> }).procedures;
    expect(Object.keys(procedures)).toContain("ai.dailySummary");
  });
});
