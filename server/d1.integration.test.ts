/**
 * Vitest port of tests/test-d1-local.ts (orphaned since 2026-08-06).
 * Spins up a throwaway better-sqlite3 DB, applies drizzle/d1_schema.sql,
 * and exercises CRUD on users, pets, healthRecords, vaccinations,
 * weightRecords, subscriptions + cascade cleanup.
 * AGI experiment: dead-code activation — wire orphaned tests into the runner.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";
import {
  users,
  pets,
  healthRecords,
  vaccinations,
  weightRecords,
  subscriptions,
} from "../drizzle/schema";

let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userId: number;
let petId: number;

beforeAll(() => {
  const dbPath = join(tmpdir(), `pethealth-test-${process.pid}-${Date.now()}.db`);
  sqlite = new Database(dbPath);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  const schemaSql = readFileSync(join(import.meta.dirname, "..", "drizzle", "d1_schema.sql"), "utf-8");
  sqlite.exec(schemaSql);
  db = drizzle(sqlite, { schema });
});

afterAll(() => {
  sqlite?.close();
});

describe("1. User CRUD", () => {
  it("create user with email + role", async () => {
    const [user1] = await db
      .insert(users)
      .values({
        openId: "test-openid-1",
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hash$123",
        loginMethod: "email",
        role: "user",
      })
      .returning();
    userId = user1.id;
    expect(user1.id).toBeGreaterThan(0);
    expect(user1.email).toBe("test@example.com");
  });

  it("query user by openId", async () => {
    const [foundUser] = await db.select().from(users).where(eq(users.openId, "test-openid-1")).limit(1);
    expect(foundUser?.email).toBe("test@example.com");
  });

  it("update user name", async () => {
    await db.update(users).set({ name: "Updated Name" }).where(eq(users.id, userId));
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    expect(updatedUser.name).toBe("Updated Name");
  });
});

describe("2. Pet CRUD", () => {
  it("create pet + query by user", async () => {
    const [pet1] = await db
      .insert(pets)
      .values({ userId, name: "Momo", breed: "Golden Retriever", gender: "male" })
      .returning();
    petId = pet1.id;
    expect(pet1.id).toBeGreaterThan(0);

    const userPets = await db.select().from(pets).where(eq(pets.userId, userId));
    expect(userPets.length).toBe(1);
  });
});

describe("3. Health Records CRUD", () => {
  it("create + query health record", async () => {
    const [record1] = await db
      .insert(healthRecords)
      .values({
        petId,
        recordType: "vet_visit",
        date: new Date(),
        diagnosis: "Healthy",
        vetName: "Dr. Somchai",
      })
      .returning();
    expect(record1.id).toBeGreaterThan(0);

    const records = await db.select().from(healthRecords).where(eq(healthRecords.petId, petId));
    expect(records.length).toBe(1);
    expect(records[0].diagnosis).toBe("Healthy");
  });
});

describe("4. Vaccinations CRUD", () => {
  it("create vaccination with next-due date", async () => {
    const [vacc1] = await db
      .insert(vaccinations)
      .values({
        petId,
        vaccineName: "Rabies",
        lastDate: new Date(),
        nextDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      })
      .returning();
    expect(vacc1.id).toBeGreaterThan(0);
    expect(vacc1.vaccineName).toBe("Rabies");
  });
});

describe("5. Weight Records CRUD", () => {
  it("create weight record", async () => {
    const [weight1] = await db
      .insert(weightRecords)
      .values({ petId, date: new Date(), weight: 25, unit: "kg" })
      .returning();
    expect(weight1.id).toBeGreaterThan(0);
  });
});

describe("6. Subscription CRUD", () => {
  it("create free subscription then upgrade to premium", async () => {
    const [sub1] = await db
      .insert(subscriptions)
      .values({ userId, tier: "free", status: "active" })
      .returning();
    expect(sub1.id).toBeGreaterThan(0);
    expect(sub1.tier).toBe("free");

    await db.update(subscriptions).set({ tier: "premium" }).where(eq(subscriptions.userId, userId));
    const [upgradedSub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    expect(upgradedSub.tier).toBe("premium");
  });
});

describe("7. Cleanup", () => {
  it("deletes all seeded data", async () => {
    await db.delete(healthRecords).where(eq(healthRecords.petId, petId));
    await db.delete(vaccinations).where(eq(vaccinations.petId, petId));
    await db.delete(weightRecords).where(eq(weightRecords.petId, petId));
    await db.delete(pets).where(eq(pets.userId, userId));
    await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
    await db.delete(users).where(eq(users.id, userId));
    const remainingUsers = await db.select().from(users);
    expect(remainingUsers.length).toBe(0);
  });
});
