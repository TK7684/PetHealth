# PetHealth

A comprehensive pet health management application built with React, TypeScript, tRPC, and Drizzle ORM.

## Features

- 🐾 **Pet Management**: Track multiple pets with detailed profiles
- 💉 **Health Records**: Vaccinations, medications, and health history
- 📅 **Scheduling**: Feeding schedules, medication reminders, and daily activities
- 📊 **Analytics**: Weight tracking and health trends
- 💰 **Expense Tracking**: Monitor pet-related costs
- 🤖 **AI Assistant**: Get health advice and recommendations
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: tRPC, Express (for local dev)
- **Database**: MySQL (local) / Cloudflare D1 (production)
- **Deployment**: Cloudflare Workers + Pages
- **ORM**: Drizzle ORM

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or pnpm
- MySQL database (for local development)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

## Deployment

### Cloudflare (Free Tier)

This project is configured for deployment to Cloudflare Workers and Pages using **100% free services**.

See [DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md) for complete deployment guide.

Quick start:
```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

### Database Options

- **Cloudflare D1** (Recommended - Free): SQLite database native to Workers
- **PlanetScale** (Free Tier): MySQL with connection pooling
- **Neon/Supabase**: Free Postgres options

See [WORKERS_DATABASE.md](./WORKERS_DATABASE.md) for database migration guide.

## Project Structure

```
PetHealth/
├── client/          # React frontend
├── server/          # tRPC backend
├── workers/         # Cloudflare Workers entry point
├── shared/          # Shared types and constants
├── drizzle/         # Database schema and migrations
└── dist/            # Build output
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:workers` - Build Workers bundle
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run deploy:prod` - Deploy to production environment

## Documentation

- [DEPLOYMENT_FREE.md](./DEPLOYMENT_FREE.md) - Free tier deployment guide
- [QUICK_START_FREE.md](./QUICK_START_FREE.md) - Quick deployment guide
- [WORKERS_DATABASE.md](./WORKERS_DATABASE.md) - Database migration guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide

## License

MIT

