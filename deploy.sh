#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════"
echo "  PetHealth MVP Deploy Script"
echo "═══════════════════════════════════════════"

# Step 0: Check wrangler auth
echo ""
echo "[0/5] Checking Cloudflare authentication..."
if ! npx wrangler whoami >/dev/null 2>&1; then
  echo "❌ Not authenticated with Cloudflare."
  echo "   Run: npx wrangler login"
  echo "   (Opens browser — you need to be present for this step)"
  exit 1
fi
echo "✅ Authenticated"

# Step 1: Create D1 database (if not exists)
echo ""
echo "[1/5] Setting up D1 database..."
DB_ID=$(npx wrangler d1 list 2>/dev/null | grep "pethealth-db" | awk '{print $NF}' || echo "")

if [ -z "$DB_ID" ]; then
  echo "  Creating D1 database 'pethealth-db'..."
  DB_OUTPUT=$(npx wrangler d1 create pethealth-db 2>&1)
  DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | head -1 | awk -F'"' '{print $2}')
  if [ -z "$DB_ID" ]; then
    # Try alternative parsing
    DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id\s*=\s*"[^"]*"' | head -1 | awk -F'"' '{print $2}')
  fi
  echo "  ✅ Created database: $DB_ID"

  # Update wrangler.toml with real database_id
  if [ -n "$DB_ID" ]; then
    sed -i "s/database_id = \"PLACEHOLDER_RUN_WRANGLER_D1_CREATE\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo "  ✅ Updated wrangler.toml with database_id"
  fi
else
  echo "  ✅ Database already exists: $DB_ID"
  # Make sure wrangler.toml has the right ID
  CURRENT_ID=$(grep "database_id" wrangler.toml | head -1 | awk -F'"' '{print $2}')
  if [ "$CURRENT_ID" != "$DB_ID" ]; then
    sed -i "s/database_id = \"$CURRENT_ID\"/database_id = \"$DB_ID\"/" wrangler.toml
    echo "  ✅ Updated wrangler.toml with correct database_id"
  fi
fi

# Step 2: Initialize database schema
echo ""
echo "[2/5] Applying D1 schema..."
npx wrangler d1 execute pethealth-db --file=./drizzle/d1_schema.sql
echo "✅ Schema applied"

# Step 3: Set required secrets
echo ""
echo "[3/5] Checking secrets..."

# JWT_SECRET — generate if not set
if ! npx wrangler secret list 2>/dev/null | grep -q "JWT_SECRET"; then
  JWT_SECRET=$(openssl rand -base64 32)
  echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET
  echo "  ✅ JWT_SECRET generated and set"
else
  echo "  ✅ JWT_SECRET already set"
fi

# Step 4: Build
echo ""
echo "[4/5] Building frontend + workers bundle..."
npm run build:workers
echo "✅ Build complete"

# Step 5: Deploy
echo ""
echo "[5/5] Deploying to Cloudflare Workers..."
npx wrangler deploy --no-bundle

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ PetHealth deployed successfully!"
echo "═══════════════════════════════════════════"
echo ""
echo "Your app is live at the URL shown above."
echo ""
echo "Test it:"
echo "  1. Visit the URL"
echo "  2. Click Sign Up"
echo "  3. Register with email/password"
echo "  4. Add a pet"
echo "  5. Try the health records, vaccinations, etc."
echo ""
