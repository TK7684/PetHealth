# Cloudflare Deployment Guide

This guide explains how to deploy PetHealth to Cloudflare Workers and Pages.

> **💡 Looking for a 100% free solution?** See [DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md) for a complete guide using only free tier services!

## Architecture

- **Frontend**: Deployed to Cloudflare Pages (static files from `dist/public`)
- **API**: Deployed to Cloudflare Workers (tRPC server, OAuth, Stripe webhooks)

## Prerequisites

1. Install Wrangler CLI (already installed as dev dependency)
2. Authenticate with Cloudflare:
   ```bash
   npx wrangler login
   ```

## Setup Environment Variables

Set all required secrets in Cloudflare:

```bash
# Required secrets
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put VITE_APP_ID
npx wrangler secret put OAUTH_SERVER_URL
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PUBLISHABLE_KEY
npx wrangler secret put S3_BUCKET
npx wrangler secret put S3_REGION
npx wrangler secret put S3_ACCESS_KEY_ID
npx wrangler secret put S3_SECRET_ACCESS_KEY

# Optional secrets
npx wrangler secret put OWNER_OPEN_ID
npx wrangler secret put BUILT_IN_FORGE_API_URL
npx wrangler secret put BUILT_IN_FORGE_API_KEY
npx wrangler secret put EMAIL_SERVICE_API_KEY
npx wrangler secret put EMAIL_FROM_ADDRESS
npx wrangler secret put SMS_SERVICE_API_KEY
npx wrangler secret put STRIPE_MONTHLY_PRICE_ID
npx wrangler secret put STRIPE_YEARLY_PRICE_ID
```

Or set them in the Cloudflare Dashboard:
1. Go to Workers & Pages → Your Worker → Settings → Variables and Secrets
2. Add each secret

## Deployment Steps

### 1. Build the Project

```bash
npm run build:workers
```

This will:
- Build the frontend with Vite
- Bundle the Workers code with esbuild

### 2. Deploy to Cloudflare Workers

```bash
# Deploy to production
npm run deploy:prod

# Or deploy to default environment
npm run deploy
```

### 3. Deploy Frontend to Cloudflare Pages

The frontend should be deployed separately to Cloudflare Pages:

1. Go to Cloudflare Dashboard → Workers & Pages → Create Application → Pages
2. Connect your Git repository or upload the `dist/public` folder
3. Set build command: `npm run build` (only builds frontend)
4. Set output directory: `dist/public`
5. Add environment variables if needed for the build process

### 4. Configure Custom Domain (Optional)

1. In Cloudflare Pages, go to your project → Custom domains
2. Add your domain
3. Update DNS records as instructed

## Development

To test locally with Wrangler:

```bash
# Start local development server
npx wrangler dev

# Or with specific environment
npx wrangler dev --env production
```

## Important Notes

1. **Static Files**: The Workers code returns 404 for static files. These should be served by Cloudflare Pages.

2. **CORS**: If your frontend and API are on different domains, you may need to configure CORS headers.

3. **Database**: 
   - Ensure your database is accessible from Cloudflare Workers (may need to allowlist Cloudflare IPs)
   - **Note**: Direct MySQL connections may have limitations in Workers. Consider:
     - Using a connection pooler (e.g., PlanetScale, Railway)
     - Using HTTP-based database APIs
     - Migrating to Cloudflare D1 (SQLite) for better Workers compatibility
   - The `nodejs_compat` flag enables Node.js APIs, but TCP connections may still have restrictions

4. **OAuth Redirects**: Update your OAuth provider's redirect URI to point to your Workers URL: `https://pethealth.your-subdomain.workers.dev/api/oauth/callback`

5. **Stripe Webhooks**: Update your Stripe webhook URL to: `https://pethealth.your-subdomain.workers.dev/webhook/stripe`

## Troubleshooting

- **Build errors**: Check that all dependencies are compatible with Cloudflare Workers
- **Runtime errors**: Check Cloudflare Workers logs in the dashboard
- **Environment variables**: Verify all secrets are set correctly
- **Database connection**: Ensure database allows connections from Cloudflare IPs

