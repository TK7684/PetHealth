/**
 * Auth integration test — PBKDF2 password hashing + JWT session verification.
 * Run: npx tsx tests/test-auth.ts
 */
import { hashPassword, verifyPassword, createSessionToken, verifySession, generateOpenId } from "../server/_core/auth";

let pass = 0, fail = 0;
function check(name: string, condition: boolean) {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

console.log("\n🧪 PetHealth Auth Tests\n");

// Set test JWT secret
process.env.JWT_SECRET = "test-secret-for-testing-1234567890";

// ===== 1. Password Hashing =====
console.log("1. Password Hashing (PBKDF2)");
const hash = await hashPassword("mypassword123");
check("Hash is non-empty", hash.length > 0);
check("Hash starts with pbkdf2$", hash.startsWith("pbkdf2$"));
check("Hash contains salt+hash", hash.split("$").length === 4);

// ===== 2. Password Verification =====
console.log("\n2. Password Verification");
const correctMatch = await verifyPassword("mypassword123", hash);
check("Correct password matches", correctMatch);

const wrongMatch = await verifyPassword("wrongpassword", hash);
check("Wrong password rejected", !wrongMatch);

// Different hash for same password (random salt)
const hash2 = await hashPassword("mypassword123");
check("Salt is random (different hashes)", hash !== hash2);

// ===== 3. Session Token =====
console.log("\n3. JWT Session Token");
const token = await createSessionToken("user-openid-123", { name: "Test User" });
check("Token is non-empty", token.length > 0);
check("Token has 3 parts (header.payload.signature)", token.split(".").length === 3);

const session = await verifySession(token);
check("Session verified", session !== null);
check("Session has correct openId", session?.openId === "user-openid-123");
check("Session has correct name", session?.name === "Test User");

// ===== 4. Invalid Session =====
console.log("\n4. Invalid Session Handling");
const invalidSession = await verifySession("invalid.jwt.token");
check("Invalid token rejected", invalidSession === null);

const nullSession = await verifySession(null);
check("Null token rejected", nullSession === null);

const emptySession = await verifySession("");
check("Empty token rejected", emptySession === null);

// ===== 5. OpenId Generation =====
console.log("\n5. OpenId Generation");
const openId1 = generateOpenId();
const openId2 = generateOpenId();
check("OpenId is 32 chars", openId1.length === 32);
check("OpenIds are unique", openId1 !== openId2);

// Summary
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(40)}\n`);

process.exit(fail > 0 ? 1 : 0);
