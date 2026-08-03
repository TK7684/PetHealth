import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user table — email/password auth (replaced Manus OAuth).
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email").unique(),
  passwordHash: text("passwordHash"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  stripeCustomerId: text("stripeCustomerId"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Pet information */
export const pets = sqliteTable("pets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  name: text("name").notNull(),
  breed: text("breed"),
  birthDate: integer("birthDate", { mode: "timestamp" }),
  photoUrl: text("photoUrl"),
  gender: text("gender", { enum: ["male", "female", "unknown"] }).default("unknown"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/** Health records — vet visit details */
export const healthRecords = sqliteTable("health_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  recordType: text("recordType").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  symptoms: text("symptoms"),
  diagnosis: text("diagnosis"),
  vetName: text("vetName"),
  clinicName: text("clinicName"),
  cost: integer("cost"),
  medications: text("medications"),
  nextAppointment: integer("nextAppointment", { mode: "timestamp" }),
  photoUrls: text("photoUrls"),
  notes: text("notes"),
  attachmentUrl: text("attachmentUrl"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type HealthRecord = typeof healthRecords.$inferSelect;
export type InsertHealthRecord = typeof healthRecords.$inferInsert;

/** Vaccinations */
export const vaccinations = sqliteTable("vaccinations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  vaccineName: text("vaccineName").notNull(),
  lastDate: integer("lastDate", { mode: "timestamp" }).notNull(),
  nextDate: integer("nextDate", { mode: "timestamp" }),
  reminderEnabled: integer("reminderEnabled").default(1).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Vaccination = typeof vaccinations.$inferSelect;
export type InsertVaccination = typeof vaccinations.$inferInsert;

/** Behavior logs */
export const behaviorLogs = sqliteTable("behavior_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  behaviorType: text("behaviorType").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type BehaviorLog = typeof behaviorLogs.$inferSelect;
export type InsertBehaviorLog = typeof behaviorLogs.$inferInsert;

/** Weight records */
export const weightRecords = sqliteTable("weight_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  weight: integer("weight").notNull(),
  unit: text("unit").default("kg").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type WeightRecord = typeof weightRecords.$inferSelect;
export type InsertWeightRecord = typeof weightRecords.$inferInsert;

/** Expenses (Premium) */
export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/** Feeding schedules */
export const feedingSchedules = sqliteTable("feeding_schedules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  foodType: text("foodType").notNull(),
  amount: text("amount").notNull(),
  frequency: text("frequency").notNull(),
  time: text("time"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type FeedingSchedule = typeof feedingSchedules.$inferSelect;
export type InsertFeedingSchedule = typeof feedingSchedules.$inferInsert;

/** Sick care logs (Premium) */
export const sickCareLogs = sqliteTable("sick_care_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  startDate: integer("startDate", { mode: "timestamp" }).notNull(),
  endDate: integer("endDate", { mode: "timestamp" }),
  symptoms: text("symptoms").notNull(),
  medications: text("medications"),
  status: text("status", { enum: ["ongoing", "recovered", "monitoring"] }).default("ongoing").notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type SickCareLog = typeof sickCareLogs.$inferSelect;
export type InsertSickCareLog = typeof sickCareLogs.$inferInsert;

/** Subscriptions */
export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique(),
  tier: text("tier", { enum: ["free", "premium"] }).default("free").notNull(),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  stripePriceId: text("stripePriceId"),
  startDate: integer("startDate", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  endDate: integer("endDate", { mode: "timestamp" }),
  status: text("status", { enum: ["active", "expired", "cancelled"] }).default("active").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/** Medications — flea/tick, deworming */
export const medications = sqliteTable("medications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  medicationType: text("medicationType", { enum: ["flea_tick", "deworming", "other"] }).notNull(),
  medicationName: text("medicationName").notNull(),
  lastGivenDate: integer("lastGivenDate", { mode: "timestamp" }).notNull(),
  nextDueDate: integer("nextDueDate", { mode: "timestamp" }),
  dosage: text("dosage"),
  frequency: text("frequency"),
  reminderEnabled: integer("reminderEnabled").default(1).notNull(),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = typeof medications.$inferInsert;

/** Daily activities with Instagram integration */
export const dailyActivities = sqliteTable("daily_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  petId: integer("petId").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  activityType: text("activityType").notNull(),
  description: text("description"),
  photoUrls: text("photoUrls"),
  instagramPostUrl: text("instagramPostUrl"),
  duration: integer("duration"),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export type DailyActivity = typeof dailyActivities.$inferSelect;
export type InsertDailyActivity = typeof dailyActivities.$inferInsert;
