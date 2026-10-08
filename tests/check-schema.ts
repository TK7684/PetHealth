/** Quick schema check. Run: npx tsx tests/check-schema.ts */
import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

const db = new Database(":memory:");
db.exec(readFileSync("./drizzle/d1_schema.sql", "utf-8"));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[];
console.log("Tables:", tables.map(t => t.name).join(", "));
console.log("memos exists:", tables.some(t => t.name === "memos"));
console.log("ai_insights exists:", tables.some(t => t.name === "ai_insights"));
db.close();
