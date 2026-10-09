DROP TABLE IF EXISTS users;
CREATE TABLE users (
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
