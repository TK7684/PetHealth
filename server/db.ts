import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import {
  users,
  pets,
  healthRecords,
  vaccinations,
  behaviorLogs,
  weightRecords,
  expenses,
  feedingSchedules,
  sickCareLogs,
  subscriptions,
  medications,
  dailyActivities,
  type User,
  type InsertUser,
  type Pet,
  type InsertPet,
  type HealthRecord,
  type InsertHealthRecord,
  type Vaccination,
  type InsertVaccination,
  type BehaviorLog,
  type InsertBehaviorLog,
  type WeightRecord,
  type InsertWeightRecord,
  type Expense,
  type InsertExpense,
  type FeedingSchedule,
  type InsertFeedingSchedule,
  type SickCareLog,
  type InsertSickCareLog,
  type Subscription,
  type InsertSubscription,
  type Medication,
  type InsertMedication,
  type DailyActivity,
  type InsertDailyActivity,
} from "../drizzle/schema";

// D1 database instance, set from Workers env or local dev fallback
let _db: ReturnType<typeof drizzle> | null = null;
let _binding: D1Database | null = null;

export function setDatabase(binding: D1Database) {
  _binding = binding;
  _db = drizzle(binding);
}

export function getDb() {
  return _db;
}

// ========== User Queries ==========

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

  const now = new Date();
  if (existing.length > 0) {
    const updateSet: Record<string, unknown> = { updatedAt: now };
    if (user.name !== undefined) updateSet.name = user.name;
    if (user.email !== undefined) updateSet.email = user.email;
    if (user.passwordHash !== undefined) updateSet.passwordHash = user.passwordHash;
    if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
    if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
    if (user.role !== undefined) updateSet.role = user.role;
    await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
  } else {
    await db.insert(users).values({
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      passwordHash: user.passwordHash ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? "user",
      lastSignedIn: user.lastSignedIn ?? now,
    });
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ========== Pet Queries ==========

export async function getUserPets(userId: number): Promise<Pet[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(pets).where(eq(pets.userId, userId)).orderBy(desc(pets.createdAt));
}

export async function getPetById(petId: number, userId: number): Promise<Pet | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId))).limit(1);
  return result[0];
}

export async function createPet(pet: InsertPet): Promise<Pet> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pets).values(pet);
  const result = await db.select().from(pets).where(eq(pets.userId, pet.userId)).orderBy(desc(pets.createdAt)).limit(1);
  return result[0]!;
}

export async function updatePet(petId: number, userId: number, data: Partial<InsertPet>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pets).set({ ...data, updatedAt: new Date() }).where(and(eq(pets.id, petId), eq(pets.userId, userId)));
}

export async function deletePet(petId: number, userId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pets).where(and(eq(pets.id, petId), eq(pets.userId, userId)));
}

// ========== Health Record Queries ==========

export async function getHealthRecords(petId: number): Promise<HealthRecord[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(healthRecords).where(eq(healthRecords.petId, petId)).orderBy(desc(healthRecords.date));
}

export async function createHealthRecord(record: InsertHealthRecord): Promise<HealthRecord> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(healthRecords).values(record);
  const result = await db.select().from(healthRecords).orderBy(desc(healthRecords.id)).limit(1);
  return result[0]!;
}

export async function deleteHealthRecord(recordId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(healthRecords).where(eq(healthRecords.id, recordId));
}

export async function countHealthRecordsThisMonth(petId: number): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db.select().from(healthRecords).where(eq(healthRecords.petId, petId));
  return result.filter(r => new Date(r.createdAt) >= startOfMonth).length;
}

// ========== Vaccination Queries ==========

export async function getVaccinations(petId: number): Promise<Vaccination[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(vaccinations).where(eq(vaccinations.petId, petId)).orderBy(desc(vaccinations.lastDate));
}

export async function createVaccination(vacc: InsertVaccination): Promise<Vaccination> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(vaccinations).values(vacc);
  const result = await db.select().from(vaccinations).orderBy(desc(vaccinations.id)).limit(1);
  return result[0]!;
}

export async function updateVaccination(vaccinationId: number, data: Partial<InsertVaccination>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(vaccinations).set({ ...data, updatedAt: new Date() }).where(eq(vaccinations.id, vaccinationId));
}

export async function deleteVaccination(vaccinationId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(vaccinations).where(eq(vaccinations.id, vaccinationId));
}

// ========== Behavior Log Queries ==========

export async function getBehaviorLogs(petId: number): Promise<BehaviorLog[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(behaviorLogs).where(eq(behaviorLogs.petId, petId)).orderBy(desc(behaviorLogs.date));
}

export async function createBehaviorLog(log: InsertBehaviorLog): Promise<BehaviorLog> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(behaviorLogs).values(log);
  const result = await db.select().from(behaviorLogs).orderBy(desc(behaviorLogs.id)).limit(1);
  return result[0]!;
}

export async function deleteBehaviorLog(logId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(behaviorLogs).where(eq(behaviorLogs.id, logId));
}

export async function countBehaviorLogsThisMonth(petId: number): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db.select().from(behaviorLogs).where(eq(behaviorLogs.petId, petId));
  return result.filter(r => new Date(r.createdAt) >= startOfMonth).length;
}

// ========== Weight Record Queries ==========

export async function getWeightRecords(petId: number): Promise<WeightRecord[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(weightRecords).where(eq(weightRecords.petId, petId)).orderBy(desc(weightRecords.date));
}

export async function createWeightRecord(record: InsertWeightRecord): Promise<WeightRecord> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(weightRecords).values(record);
  const result = await db.select().from(weightRecords).orderBy(desc(weightRecords.id)).limit(1);
  return result[0]!;
}

export async function deleteWeightRecord(recordId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(weightRecords).where(eq(weightRecords.id, recordId));
}

// ========== Expense Queries (Premium) ==========

export async function getExpenses(petId: number): Promise<Expense[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.petId, petId)).orderBy(desc(expenses.date));
}

export async function createExpense(expense: InsertExpense): Promise<Expense> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(expenses).values(expense);
  const result = await db.select().from(expenses).orderBy(desc(expenses.id)).limit(1);
  return result[0]!;
}

export async function deleteExpense(expenseId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(expenses).where(eq(expenses.id, expenseId));
}

// ========== Feeding Schedule Queries ==========

export async function getFeedingSchedules(petId: number): Promise<FeedingSchedule[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(feedingSchedules).where(eq(feedingSchedules.petId, petId)).orderBy(desc(feedingSchedules.createdAt));
}

export async function createFeedingSchedule(schedule: InsertFeedingSchedule): Promise<FeedingSchedule> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(feedingSchedules).values(schedule);
  const result = await db.select().from(feedingSchedules).orderBy(desc(feedingSchedules.id)).limit(1);
  return result[0]!;
}

export async function updateFeedingSchedule(scheduleId: number, data: Partial<InsertFeedingSchedule>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(feedingSchedules).set({ ...data, updatedAt: new Date() }).where(eq(feedingSchedules.id, scheduleId));
}

export async function deleteFeedingSchedule(scheduleId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(feedingSchedules).where(eq(feedingSchedules.id, scheduleId));
}

// ========== Sick Care Log Queries (Premium) ==========

export async function getSickCareLogs(petId: number): Promise<SickCareLog[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(sickCareLogs).where(eq(sickCareLogs.petId, petId)).orderBy(desc(sickCareLogs.startDate));
}

export async function createSickCareLog(log: InsertSickCareLog): Promise<SickCareLog> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sickCareLogs).values(log);
  const result = await db.select().from(sickCareLogs).orderBy(desc(sickCareLogs.id)).limit(1);
  return result[0]!;
}

export async function updateSickCareLog(logId: number, data: Partial<InsertSickCareLog>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(sickCareLogs).set({ ...data, updatedAt: new Date() }).where(eq(sickCareLogs.id, logId));
}

export async function deleteSickCareLog(logId: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(sickCareLogs).where(eq(sickCareLogs.id, logId));
}

// ========== Subscription Queries ==========

export async function getUserSubscription(userId: number): Promise<Subscription | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function createSubscription(sub: InsertSubscription): Promise<Subscription> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(subscriptions).values(sub);
  const result = await db.select().from(subscriptions).orderBy(desc(subscriptions.id)).limit(1);
  return result[0]!;
}

export async function updateSubscription(userId: number, data: Partial<InsertSubscription>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.userId, userId));
}

// ========== Medication Queries ==========

export async function getMedications(petId: number): Promise<Medication[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(medications).where(eq(medications.petId, petId)).orderBy(desc(medications.lastGivenDate));
}

export async function createMedication(med: InsertMedication): Promise<Medication> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(medications).values(med);
  const result = await db.select().from(medications).orderBy(desc(medications.id)).limit(1);
  return result[0]!;
}

export async function getMedicationById(id: number): Promise<Medication | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(medications).where(eq(medications.id, id)).limit(1);
  return result[0];
}

export async function updateMedication(id: number, data: Partial<InsertMedication>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(medications).set({ ...data, updatedAt: new Date() }).where(eq(medications.id, id));
}

export async function deleteMedication(id: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(medications).where(eq(medications.id, id));
}

// ========== Daily Activity Queries ==========

export async function getDailyActivities(petId: number): Promise<DailyActivity[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(dailyActivities).where(eq(dailyActivities.petId, petId)).orderBy(desc(dailyActivities.date));
}

export async function createDailyActivity(activity: InsertDailyActivity): Promise<DailyActivity> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(dailyActivities).values(activity);
  const result = await db.select().from(dailyActivities).orderBy(desc(dailyActivities.id)).limit(1);
  return result[0]!;
}

export async function getDailyActivityById(id: number): Promise<DailyActivity | undefined> {
  const db = getDb();
  if (!db) return undefined;
  const result = await db.select().from(dailyActivities).where(eq(dailyActivities.id, id)).limit(1);
  return result[0];
}

export async function updateDailyActivity(id: number, data: Partial<InsertDailyActivity>): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dailyActivities).set({ ...data, updatedAt: new Date() }).where(eq(dailyActivities.id, id));
}

export async function deleteDailyActivity(id: number): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dailyActivities).where(eq(dailyActivities.id, id));
}
