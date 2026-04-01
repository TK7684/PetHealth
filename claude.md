# Claude Code Context - PetHealth

## Project Overview

PetHealth is a comprehensive pet health management application built as a modern full-stack web app.

**Tech Stack:**
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS 4.x, shadcn/ui components
- **Backend**: tRPC (end-to-end typesafe APIs), Express (local dev)
- **Database**: Drizzle ORM with MySQL (local) / Cloudflare D1 (production)
- **Deployment**: Cloudflare Workers + Pages (100% free tier)
- **Routing**: Wouter (lightweight React router)
- **State**: TanStack Query (React Query) for server state
- **AI**: OpenAI integration for health advice

## Project Structure

```
PetHealth/
├── client/              # React frontend (Vite)
│   ├── src/
│   │   ├── _core/       # Core hooks (useAuth.ts)
│   │   ├── components/  # React components + ui/ (shadcn)
│   │   └── App.tsx      # Main app with routing
│   └── public/          # Static assets + _redirects (SPA routing)
├── server/              # tRPC backend
│   └── _core/
│       ├── index.ts     # Express server setup
│       └── routers/     # tRPC routers
├── workers/             # Cloudflare Workers entry point
├── shared/              # Shared types between client/server
│   └── _core/
├── drizzle/             # Database schema & migrations
│   ├── schema.ts        # Database models
│   └── migrations/      # SQL migrations
└── dist/                # Build output (gitignored)
```

## Key Commands

```bash
# Development
npm run dev              # Start dev server (tsx watch + vite)

# Building
npm run build            # Production build (vite + esbuild)
npm run build:workers    # Build for Cloudflare Workers

# Database
npm run db:push          # Generate & run migrations

# Deployment
npm run deploy           # Deploy to Cloudflare (staging)
npm run deploy:prod      # Deploy to production

# Testing & Quality
npm run test             # Run Vitest tests
npm run check            # TypeScript type checking
npm run format           # Prettier formatting
```

## Development Patterns

### Database (Drizzle ORM)
- Schema defined in `drizzle/schema.ts`
- Use `drizzle-kit generate` to create migrations
- Use `drizzle-kit migrate` to apply migrations
- Local: MySQL via mysql2
- Production: Cloudflare D1 (SQLite)

### tRPC API
- Routers in `server/_core/routers/`
- End-to-end type safety between client/server
- Context-based auth via cookies/JWTs (jose)

### Frontend Architecture
- Client-side routing with Wouter
- Server state via TanStack Query (useQuery, useMutation)
- UI components from shadcn/ui (Radix UI + Tailwind)
- Authentication hook: `useAuth.ts`

### Authentication
- JWT-based using `jose` library
- Cookies for session management
- Protected routes check auth context

## Deployment Notes

This project is optimized for **100% free hosting** on Cloudflare:
- **Cloudflare Pages**: Frontend (static assets)
- **Cloudflare Workers**: Backend (tRPC server)
- **Cloudflare D1**: Database (free SQLite)

See `DEPLOYMENT_FREE.md` for complete setup.

## Environment Variables

Required in `.env`:
- Database connection strings
- JWT secrets
- OpenAI API key (for AI assistant)
- Cloudflare credentials (for deployment)

## Important Files

- `wrangler.toml` - Cloudflare Workers config
- `vite.config.ts` - Vite bundler config
- `drizzle.config.ts` - Drizzle ORM config
- `_redirects` - SPA routing for Cloudflare Pages
- `.env.example` - Environment variable template

## Git Workflow

- Main branch: `main`
- Use conventional commits
- Pre-commit hooks for formatting (Prettier)
- Pre-push hooks for testing (Vitest)
