# Free Cloudflare Deployment Guide

This guide shows you how to deploy PetHealth to Cloudflare using **100% free solutions**.

## 🆓 Free Services We'll Use

### 1. **Cloudflare Workers** (Free Tier)
- ✅ **100,000 requests per day** (across all Workers)
- ✅ **10ms CPU time per request**
- ✅ **Free `*.workers.dev` subdomain**
- ✅ Unlimited bandwidth
- Perfect for your API (tRPC, OAuth, Stripe webhooks)

### 2. **Cloudflare Pages** (Free Tier)
- ✅ **Unlimited builds and deployments**
- ✅ **Unlimited bandwidth**
- ✅ **Free `*.pages.dev` subdomain**
- ✅ Automatic SSL certificates
- ✅ Git integration (GitHub, GitLab, Bitbucket)
- Perfect for your React frontend

### 3. **Cloudflare D1** (Free Tier) - Recommended Database
- ✅ **5 GB storage**
- ✅ **5 million reads per month**
- ✅ **100,000 writes per month**
- ✅ **100,000 deletes per month**
- ✅ SQLite-based (compatible with Drizzle ORM)
- ✅ **Best option for Cloudflare Workers** (native integration)

### 4. **Alternative Free Database Options** (if you prefer MySQL)
- **PlanetScale** (Free Tier): 5GB storage, 1 billion row reads/month
- **Neon** (Free Tier): 0.5GB storage, serverless Postgres
- **Supabase** (Free Tier): 500MB database, Postgres
- **Railway** (Free Tier): $5 credit/month (can run MySQL)

## 📋 Prerequisites

1. **Free Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com/)
2. **GitHub Account** (free): For deploying Pages
3. **Node.js installed** (for local development)

## 🚀 Step-by-Step Deployment

### Step 1: Authenticate with Cloudflare

```bash
# Login to Cloudflare (opens browser)
npx wrangler login
```

### Step 2: Set Up Cloudflare D1 Database (Recommended - Free)

D1 is Cloudflare's SQLite database that works perfectly with Workers:

```bash
# Create a D1 database
npx wrangler d1 create pethealth-db

# This will output something like:
# ✅ Created database pethealth-db in region WEUR
# Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.
# [[d1_databases]]
# binding = "DB"
# database_name = "pethealth-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Add the database binding to `wrangler.toml`:**

```toml
[[d1_databases]]
binding = "DB"
database_name = "pethealth-db"
database_id = "your-database-id-here"
```

**Note**: If you prefer to keep MySQL, skip this step and use one of the free MySQL options listed above.

### Step 3: Set Environment Variables (Secrets)

Set your secrets using Wrangler (all free):

```bash
# Required secrets
npx wrangler secret put DATABASE_URL
# For D1, use: npx wrangler d1 execute pethealth-db --command "SELECT 1" to get connection string
# Or for MySQL: Enter your free database connection string

npx wrangler secret put JWT_SECRET
# Enter a random secret string (e.g., generate with: openssl rand -base64 32)

npx wrangler secret put VITE_APP_ID
# Enter your OAuth app ID

npx wrangler secret put OAUTH_SERVER_URL
# Enter your OAuth server URL

# Stripe (optional - only if using payments)
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PUBLISHABLE_KEY

# S3 Storage (optional - can use Cloudflare R2 free tier instead)
npx wrangler secret put S3_BUCKET
npx wrangler secret put S3_REGION
npx wrangler secret put S3_ACCESS_KEY_ID
npx wrangler secret put S3_SECRET_ACCESS_KEY
```

**💡 Tip**: For file storage, consider **Cloudflare R2** (free tier: 10GB storage, 1M Class A operations/month) instead of S3.

### Step 4: Build and Deploy Workers (API)

```bash
# Build the Workers code
npm run build:workers

# Deploy to Cloudflare Workers (free tier)
npm run deploy

# Or deploy to production environment
npm run deploy:prod
```

Your API will be live at: `https://pethealth.your-subdomain.workers.dev`

### Step 5: Deploy Frontend to Cloudflare Pages (Free)

#### Option A: Deploy via Git (Recommended - Automatic Deployments)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Cloudflare Dashboard**:
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Click **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**

3. **Connect Your Repository**:
   - Authorize Cloudflare to access your GitHub
   - Select your `PetHealth` repository
   - Click **Begin setup**

4. **Configure Build Settings**:
   - **Project name**: `pethealth` (or your choice)
   - **Production branch**: `main` (or `master`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
   - **Root directory**: `/` (leave as is)

5. **Add Environment Variables** (if needed for build):
   - Click **Environment variables**
   - Add any variables your build process needs
   - Most can stay in Workers secrets

6. **Deploy**:
   - Click **Save and Deploy**
   - Wait for build to complete (~2-5 minutes)
   - Your site will be live at: `https://pethealth.pages.dev`

#### Option B: Deploy via Wrangler (Manual)

```bash
# Build the frontend
npm run build

# Deploy to Pages
npx wrangler pages deploy dist/public --project-name=pethealth
```

### Step 6: Connect Frontend to API

Update your frontend's API URL to point to your Workers URL:

1. **In your frontend code** (`client/src/lib/trpc.ts`), update the API URL:
   ```typescript
   // Change from localhost to your Workers URL
   const apiUrl = 'https://pethealth.your-subdomain.workers.dev';
   ```

2. **Rebuild and redeploy** the frontend.

### Step 7: Configure Custom Domain (Optional - Free)

Both Workers and Pages support free custom domains:

1. **For Pages**:
   - Go to Pages project → **Custom domains**
   - Add your domain (e.g., `pethealth.com`)
   - Update DNS as instructed (free DNS included)

2. **For Workers**:
   - Go to Workers → **Routes**
   - Add route: `pethealth.com/api/*` → Your Worker
   - Or use Cloudflare's routing to point subdomain to Worker

## 💰 Cost Breakdown: $0/month

| Service | Free Tier Limits | Your Usage |
|---------|-----------------|------------|
| **Cloudflare Workers** | 100k requests/day | ✅ Covered |
| **Cloudflare Pages** | Unlimited | ✅ Covered |
| **Cloudflare D1** | 5GB, 5M reads/month | ✅ Covered |
| **Custom Domain** | Free | ✅ Included |
| **SSL Certificate** | Free | ✅ Included |
| **CDN & DDoS Protection** | Free | ✅ Included |

**Total Cost: $0/month** 🎉

## 🔧 Free Database Setup Options

### Option 1: Cloudflare D1 (Recommended - Easiest)

D1 is SQLite and works natively with Workers:

```bash
# Create database
npx wrangler d1 create pethealth-db

# Run migrations
npx wrangler d1 execute pethealth-db --file=./drizzle/0000_odd_cloak.sql
npx wrangler d1 execute pethealth-db --file=./drizzle/0001_loud_alex_power.sql
# ... etc for all migration files

# Or use Drizzle Kit (if supported)
npm run db:push
```

**Update your database connection** in `server/db.ts` to use D1 binding instead of MySQL.

### Option 2: Free MySQL Hosting

If you need MySQL, here are free options:

1. **PlanetScale** (Recommended for MySQL):
   - Sign up: [planetscale.com](https://planetscale.com)
   - Free tier: 5GB storage, 1B row reads/month
   - Get connection string and set as `DATABASE_URL` secret

2. **Neon** (Postgres, but similar):
   - Sign up: [neon.tech](https://neon.tech)
   - Free tier: 0.5GB storage
   - Serverless Postgres

3. **Railway**:
   - Sign up: [railway.app](https://railway.app)
   - Free tier: $5 credit/month
   - Can run MySQL container

## 📊 Monitoring (Free)

Cloudflare provides free analytics:
- **Workers Analytics**: View requests, errors, CPU time
- **Pages Analytics**: View page views, bandwidth
- **D1 Analytics**: View database queries and usage

Access via Cloudflare Dashboard → Your project → Analytics

## 🚨 Important Notes

1. **Free Tier Limits**:
   - Workers: 100k requests/day (shared across all Workers)
   - D1: 5M reads/month
   - Monitor usage in Cloudflare Dashboard

2. **Database Compatibility**:
   - **D1 (SQLite)**: Best for Workers, but requires schema migration from MySQL
   - **MySQL**: Works with `nodejs_compat` flag, but may have connection limits
   - Consider using a connection pooler for MySQL

3. **File Storage**:
   - Use **Cloudflare R2** (free: 10GB) instead of S3
   - Or use free tier of other storage services

4. **OAuth Redirects**:
   - Update OAuth provider redirect URI to: `https://pethealth.your-subdomain.workers.dev/api/oauth/callback`

5. **Stripe Webhooks**:
   - Update webhook URL to: `https://pethealth.your-subdomain.workers.dev/webhook/stripe`

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist workers/index.js
npm install
npm run build:workers
```

### Database Connection Issues
- **D1**: Ensure database binding is in `wrangler.toml`
- **MySQL**: Check if database allows Cloudflare IPs (may need allowlist)
- **Connection Pooler**: Use PlanetScale or similar for better compatibility

### Environment Variables Not Working
- Use `wrangler secret put` for sensitive values
- Use `vars` in `wrangler.toml` for non-sensitive values
- Check Cloudflare Dashboard → Workers → Settings → Variables

### Frontend Can't Connect to API
- Check CORS headers in Workers
- Verify API URL in frontend code
- Check browser console for errors

## 📚 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

## ✅ Deployment Checklist

- [ ] Created Cloudflare account (free)
- [ ] Authenticated Wrangler (`npx wrangler login`)
- [ ] Created D1 database OR set up free MySQL database
- [ ] Set all required secrets (`wrangler secret put`)
- [ ] Built Workers code (`npm run build:workers`)
- [ ] Deployed Workers (`npm run deploy`)
- [ ] Connected GitHub to Cloudflare Pages
- [ ] Deployed frontend to Pages
- [ ] Updated frontend API URL
- [ ] Tested OAuth flow
- [ ] Tested API endpoints
- [ ] Configured custom domain (optional)

**You're all set! Your app is now running on Cloudflare's free tier! 🎉**

