-- PetHealth D1 (SQLite) schema — complete MVP

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openId TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT UNIQUE,
  passwordHash TEXT,
  loginMethod TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  stripeCustomerId TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
  lastSignedIn INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS pets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  name TEXT NOT NULL,
  breed TEXT,
  birthDate INTEGER,
  photoUrl TEXT,
  gender TEXT DEFAULT 'unknown',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_pets_userId ON pets(userId);

CREATE TABLE IF NOT EXISTS health_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  recordType TEXT NOT NULL,
  date INTEGER NOT NULL,
  symptoms TEXT,
  diagnosis TEXT,
  vetName TEXT,
  clinicName TEXT,
  cost INTEGER,
  medications TEXT,
  nextAppointment INTEGER,
  photoUrls TEXT,
  notes TEXT,
  attachmentUrl TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_health_records_petId ON health_records(petId);

CREATE TABLE IF NOT EXISTS vaccinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  vaccineName TEXT NOT NULL,
  lastDate INTEGER NOT NULL,
  nextDate INTEGER,
  reminderEnabled INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_vaccinations_petId ON vaccinations(petId);

CREATE TABLE IF NOT EXISTS behavior_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  date INTEGER NOT NULL,
  behaviorType TEXT NOT NULL,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_petId ON behavior_logs(petId);

CREATE TABLE IF NOT EXISTS weight_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  date INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_weight_records_petId ON weight_records(petId);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  date INTEGER NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_expenses_petId ON expenses(petId);

CREATE TABLE IF NOT EXISTS feeding_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  foodType TEXT NOT NULL,
  amount TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time TEXT,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_feeding_schedules_petId ON feeding_schedules(petId);

CREATE TABLE IF NOT EXISTS sick_care_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  startDate INTEGER NOT NULL,
  endDate INTEGER,
  symptoms TEXT NOT NULL,
  medications TEXT,
  status TEXT NOT NULL DEFAULT 'ongoing',
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_sick_care_logs_petId ON sick_care_logs(petId);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free',
  stripeSubscriptionId TEXT,
  stripePriceId TEXT,
  startDate INTEGER NOT NULL DEFAULT (unixepoch()),
  endDate INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  medicationType TEXT NOT NULL,
  medicationName TEXT NOT NULL,
  lastGivenDate INTEGER NOT NULL,
  nextDueDate INTEGER,
  dosage TEXT,
  frequency TEXT,
  reminderEnabled INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_medications_petId ON medications(petId);

CREATE TABLE IF NOT EXISTS daily_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  petId INTEGER NOT NULL,
  date INTEGER NOT NULL,
  activityType TEXT NOT NULL,
  description TEXT,
  photoUrls TEXT,
  instagramPostUrl TEXT,
  duration INTEGER,
  location TEXT,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_daily_activities_petId ON daily_activities(petId);
