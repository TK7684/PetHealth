/**
 * Vitest port of tests/test-auth.ts (orphaned since 2026-08-06).
 * Covers: PBKDF2 hashing, password verification, JWT session tokens,
 * invalid-session handling, openId generation.
 * AGI experiment: dead-code activation — wire orphaned tests into the runner.
 */
import { beforeAll, describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySession,
  generateOpenId,
} from "./_core/auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-testing-1234567890";
});

describe("1. Password Hashing (PBKDF2)", () => {
  it("hash is non-empty", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("hash starts with pbkdf2$ and has 4 parts", async () => {
    const hash = await hashPassword("mypassword123");
    expect(hash.startsWith("pbkdf2$")).toBe(true);
    expect(hash.split("$").length).toBe(4);
  });
});

describe("2. Password Verification", () => {
  it("correct password matches", async () => {
    const hash = await hashPassword("mypassword123");
    expect(await verifyPassword("mypassword123", hash)).toBe(true);
  });

  it("wrong password rejected", async () => {
    const hash = await hashPassword("mypassword123");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("salt is random (same password -> different hashes)", async () => {
    const h1 = await hashPassword("mypassword123");
    const h2 = await hashPassword("mypassword123");
    expect(h1).not.toBe(h2);
  });
});

describe("3. JWT Session Token", () => {
  it("token is non-empty with 3 parts", async () => {
    const token = await createSessionToken("user-openid-123", { name: "Test User" });
    expect(token.length).toBeGreaterThan(0);
    expect(token.split(".").length).toBe(3);
  });

  it("session verified with correct openId and name", async () => {
    const token = await createSessionToken("user-openid-123", { name: "Test User" });
    const session = await verifySession(token);
    expect(session).not.toBeNull();
    expect(session?.openId).toBe("user-openid-123");
    expect(session?.name).toBe("Test User");
  });
});

describe("4. Invalid Session Handling", () => {
  it("invalid token rejected", async () => {
    expect(await verifySession("invalid.jwt.token")).toBeNull();
  });

  it("null token rejected", async () => {
    expect(await verifySession(null)).toBeNull();
  });

  it("empty token rejected", async () => {
    expect(await verifySession("")).toBeNull();
  });
});

describe("5. OpenId Generation", () => {
  it("openId is 32 chars", () => {
    expect(generateOpenId().length).toBe(32);
  });

  it("openIds are unique", () => {
    expect(generateOpenId()).not.toBe(generateOpenId());
  });
});
