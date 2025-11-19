# Database Configuration for Cloudflare Workers

## ⚠️ Important: MySQL2 Limitation

**`mysql2` does NOT work in Cloudflare Workers** because it requires TCP connections (`net`, `tls` modules) which are not available in the Workers runtime, even with `nodejs_compat`.

## ✅ Recommended Solutions

### Option 1: Cloudflare D1 (SQLite) - **FREE & RECOMMENDED**

D1 is Cloudflare's native SQLite database that works perfectly with Workers:

```bash
# Create D1 database
npx wrangler d1 create pethealth-db

# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "pethealth-db"
database_id = "your-database-id"
```

**Migration from MySQL to D1:**
1. Export your MySQL schema
2. Convert to SQLite syntax (mostly compatible)
3. Run migrations: `npx wrangler d1 execute pethealth-db --file=./drizzle/0000_odd_cloak.sql`

**Update `server/db.ts` to use D1:**
```typescript
import { drizzle } from "drizzle-orm/d1";

export async function getDb(env?: { DB: D1Database }) {
  if (!_db && env?.DB) {
    _db = drizzle(env.DB);
  }
  return _db;
}
```

### Option 2: External Database API (HTTP-based)

Create a separate API service (Node.js server) that handles database operations:

1. Deploy your Express server to a platform that supports MySQL (Railway, Render, etc.)
2. Expose REST/GraphQL API endpoints
3. Call these endpoints from your Workers

### Option 3: Use PlanetScale HTTP API

PlanetScale offers HTTP-based database access (though limited in free tier).

## Current Status

The Workers build **externalizes** `mysql2` and `drizzle-orm/mysql2`, meaning:
- ✅ Build will succeed
- ⚠️ Database operations will fail at runtime if `mysql2` is used
- ✅ You need to switch to D1 or external API

## Quick Fix: Use D1

1. **Create D1 database:**
   ```bash
   npx wrangler d1 create pethealth-db
   ```

2. **Update `wrangler.toml`:**
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "pethealth-db"
   database_id = "your-id-here"
   ```

3. **Update `server/db.ts` to support both:**
   ```typescript
   import { drizzle } from "drizzle-orm/d1";
   import type { D1Database } from "@cloudflare/workers-types";

   export async function getDb(env?: { DB?: D1Database }) {
     if (!_db && env?.DB) {
       _db = drizzle(env.DB);
     } else if (!_db && process.env.DATABASE_URL) {
       // Fallback to MySQL for local development
       const { drizzle: drizzleMySQL } = await import("drizzle-orm/mysql2");
       _db = drizzleMySQL(process.env.DATABASE_URL);
     }
     return _db;
   }
   ```

4. **Update `workers/index.ts` to pass env:**
   ```typescript
   const db = await getDb(env);
   ```

## For Now: Deployment Will Work

The current configuration will:
- ✅ Build successfully
- ✅ Deploy to Cloudflare Workers
- ⚠️ Database calls will fail until you switch to D1 or external API

**Next step:** Set up D1 or external database API before using database features in production.

