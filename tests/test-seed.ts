/**
 * Verify seed SQL works: apply schema + seed to local SQLite, check rows.
 * Run: npx tsx tests/test-seed.ts
 */
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

const dbPath = "/tmp/pethealth-seed-test.db";
try { require("node:fs").unlinkSync(dbPath); } catch {}

const sqlite = new Database(dbPath);
sqlite.exec(readFileSync("./drizzle/d1_schema.sql", "utf-8"));
sqlite.exec(readFileSync("./drizzle/seed_tk_luca.sql", "utf-8"));

let pass = 0, fail = 0;
function check(name: string, condition: boolean, detail = "") {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${detail}`); }
}

console.log("\n🧪 Seed Verification\n");

const user = sqlite.prepare("SELECT id, openId, email, name, role, passwordHash FROM users WHERE email = 'tripetkk@gmail.com'").get() as any;
check("TK user exists", !!user);
check("TK is admin", user?.role === "admin");
check("TK has password hash", user?.passwordHash?.startsWith("pbkdf2$"));
check("TK has openId", !!user?.openId);

const pet = sqlite.prepare("SELECT id, name, gender, userId FROM pets WHERE name = 'Luca'").get() as any;
check("Luca pet exists", !!pet);
check("Luca linked to TK", pet?.userId === user?.id);

const feed = sqlite.prepare("SELECT petId, foodType, time, notes FROM feeding_schedules WHERE petId = ?").get(pet?.id) as any;
check("Luca has feeding schedule", !!feed);
check("Dinner time is 18:00", feed?.time === "18:00");
check("Notes mention historical dinner automation", feed?.notes?.includes("18:00"));

// Idempotency: run seed again, no dupes
sqlite.exec(readFileSync("./drizzle/seed_tk_luca.sql", "utf-8"));
const userCount = (sqlite.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
const petCount = (sqlite.prepare("SELECT COUNT(*) as c FROM pets").get() as any).c;
const feedCount = (sqlite.prepare("SELECT COUNT(*) as c FROM feeding_schedules").get() as any).c;
check("Re-run creates no duplicate users", userCount === 1);
check("Re-run creates no duplicate pets", petCount === 1);
check("Re-run creates no duplicate schedules", feedCount === 1);

console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(40)}\n`);

sqlite.close();
process.exit(fail > 0 ? 1 : 0);
