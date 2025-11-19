# 🚀 Quick Start: Deploy to Cloudflare (100% Free)

## What You Get for FREE:
- ✅ **Cloudflare Workers**: 100,000 API requests/day
- ✅ **Cloudflare Pages**: Unlimited frontend hosting
- ✅ **Cloudflare D1**: 5GB database, 5M reads/month
- ✅ **Custom Domain**: Free SSL included
- ✅ **Total Cost: $0/month**

## 5-Minute Setup

### 1. Login to Cloudflare
```bash
npx wrangler login
```

### 2. Create Free Database (D1)
```bash
npx wrangler d1 create pethealth-db
```
Copy the `database_id` from output and add to `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "pethealth-db"
database_id = "your-id-here"
```

### 3. Set Secrets (Required)
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put VITE_APP_ID
npx wrangler secret put OAUTH_SERVER_URL
```

### 4. Deploy API
```bash
npm run deploy
```

### 5. Deploy Frontend
**Option A - Via GitHub (Auto-deploy):**
1. Push code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
3. Workers & Pages → Create → Pages → Connect Git
4. Select repo, set:
   - Build: `npm run build`
   - Output: `dist/public`

**Option B - Manual:**
```bash
npm run build
npx wrangler pages deploy dist/public --project-name=pethealth
```

## Done! 🎉

- API: `https://pethealth.your-subdomain.workers.dev`
- Frontend: `https://pethealth.pages.dev`

## Need Help?

See [DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md) for detailed guide.

