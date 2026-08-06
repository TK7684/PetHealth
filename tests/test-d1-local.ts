/**
 * Local integration test — exercises the full D1 database layer.
 * Creates a local SQLite DB, applies the schema, and tests CRUD operations.
 * Run: npx tsx tests/test-d1-local.ts
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { users, pets, healthRecords, vaccinations, weightRecords, subscriptions } from "../drizzle/schema";
import { readFileSync } from "fs";

const dbPath = "/tmp/pethealth-test.db";
// Clean slate
try { require("fs").unlinkSync(dbPath); } catch {}

const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");

// Apply schema
const schemaSql = readFileSync("./drizzle/d1_schema.sql", "utf-8");
sqlite.exec(schemaSql);

const db = drizzle(sqlite, { schema });

let pass = 0, fail = 0;
function check(name: string, condition: boolean) {
  if (condition) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name}`); }
}

console.log("\n🧪 PetHealth D1 Integration Tests\n");

// ===== 1. User CRUD =====
console.log("1. User CRUD");
const [user1] = await db.insert(users).values({
  openId: "test-openid-1",
  email: "test@example.com",
  name: "Test User",
  passwordHash: "hash$123",
  loginMethod: "email",
  role: "user",
}).returning();
check("Create user", user1.id > 0);
check("User has email", user1.email === "test@example.com");

const [foundUser] = await db.select().from(users).where(eq(users.openId, "test-openid-1")).limit(1);
check("Query user by openId", foundUser?.email === "test@example.com");

await db.update(users).set({ name: "Updated Name" }).where(eq(users.id, user1.id));
const [updatedUser] = await db.select().from(users).where(eq(users.id, user1.id));
check("Update user name", updatedUser.name === "Updated Name");

// ===== 2. Pet CRUD =====
console.log("\n2. Pet CRUD");
const [pet1] = await db.insert(pets).values({
  userId: user1.id,
  name: "Momo",
  breed: "Golden Retriever",
  gender: "male",
}).returning();
check("Create pet", pet1.id > 0);

const userPets = await db.select().from(pets).where(eq(pets.userId, user1.id));
check("Query pets by user", userPets.length === 1);

// ===== 3. Health Records =====
console.log("\n3. Health Records CRUD");
const [record1] = await db.insert(healthRecords).values({
  petId: pet1.id,
  recordType: "vet_visit",
  date: new Date(),
  diagnosis: "Healthy",
  vetName: "Dr. Somchai",
}).returning();
check("Create health record", record1.id > 0);

const records = await db.select().from(healthRecords).where(eq(healthRecords.petId, pet1.id));
check("Query health records", records.length === 1);
check("Record has diagnosis", records[0].diagnosis === "Healthy");

// ===== 4. Vaccinations =====
console.log("\n4. Vaccinations CRUD");
const [vacc1] = await db.insert(vaccinations).values({
  petId: pet1.id,
  vaccineName: "Rabies",
  lastDate: new Date(),
  nextDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
}).returning();
check("Create vaccination", vacc1.id > 0);
check("Vaccine name correct", vacc1.vaccineName === "Rabies");

// ===== 5. Weight Records =====
console.log("\n5. Weight Records CRUD");
const [weight1] = await db.insert(weightRecords).values({
  petId: pet1.id,
  date: new Date(),
  weight: 25,
  unit: "kg",
}).returning();
check("Create weight record", weight1.id > 0);

// ===== 6. Subscription =====
console.log("\n6. Subscription CRUD");
const [sub1] = await db.insert(subscriptions).values({
  userId: user1.id,
  tier: "free",
  status: "active",
}).returning();
check("Create subscription", sub1.id > 0);
check("Default tier is free", sub1.tier === "free");

// Upgrade to premium
await db.update(subscriptions).set({ tier: "premium" }).where(eq(subscriptions.userId, user1.id));
const [upgradedSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user1.id));
check("Upgrade to premium", upgradedSub.tier === "premium");

// ===== 7. Cascade / cleanup =====
console.log("\n7. Cleanup");
await db.delete(healthRecords).where(eq(healthRecords.petId, pet1.id));
await db.delete(vaccinations).where(eq(vaccinations.petId, pet1.id));
await db.delete(weightRecords).where(eq(weightRecords.petId, pet1.id));
await db.delete(pets).where(eq(pets.userId, user1.id));
await db.delete(subscriptions).where(eq(subscriptions.userId, user1.id));
await db.delete(users).where(eq(users.id, user1.id));
const remainingUsers = await db.select().from(users);
check("Cleanup all data", remainingUsers.length === 0);

// Summary
console.log(`\n${"=".repeat(40)}`);
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log(`${"=".repeat(40)}\n`);

sqlite.close();
process.exit(fail > 0 ? 1 : 0);
