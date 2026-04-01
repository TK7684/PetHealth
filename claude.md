# 🐾 PetHealth

<div align="center">

**A full-stack pet health platform that doesn't cost a dime to deploy**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![tRPC](https://img.shields.io/badge/tRPC-11-2596BE?logo=trpc&logoColor=white)](https://trpc.io)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com)

</div>

---

## 🎯 What is this?

PetHealth is a **comprehensive pet health management application** built with cutting-edge tech and deployed on **100% free infrastructure**. Track pets, vaccinations, medications, feeding schedules, expenses, and get AI-powered health advice—all for free.

**Mission:** Make pet care accessible, organized, and smart.

---

## 🚀 Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| ⚛️ **React 19** | UI library (latest & greatest) |
| 🔷 **TypeScript 5.9** | Type-safe code |
| ⚡ **Vite** | Lightning-fast builds |
| 🎨 **Tailwind CSS 4.x** | Utility-first styling |
| 🧩 **shadcn/ui** | Beautiful accessible components |
| 📍 **Wouter** | Minimal routing (~3KB!) |
| 📊 **TanStack Query** | Server state management |

### Backend
| Tech | Purpose |
|------|---------|
| 🔗 **tRPC** | End-to-end type safety |
| 🍪 **jose** | JWT authentication |
| 🗄️ **Drizzle ORM** | Type-safe database queries |

### Database & Deployment
| Tech | Purpose |
|------|---------|
| 🪶 **Cloudflare D1** | Free SQLite database |
| ⚡ **Cloudflare Workers** | Serverless backend |
| 🌐 **Cloudflare Pages** | Global CDN hosting |
| 🤖 **OpenAI** | AI health assistant |

---

## 📁 Project Structure

```
PetHealth/
├── 📂 client/                    # React frontend
│   ├── src/
│   │   ├── _core/               # 🔐 Core hooks (useAuth.ts)
│   │   ├── components/          # ⚛️ React components
│   │   │   └── ui/              # 🎨 shadcn/ui components
│   │   └── App.tsx              # 🚪 Main app with routing
│   └── public/                  # 📦 Static assets + _redirects
│
├── 📂 server/                    # tRPC backend
│   └── _core/
│       ├── index.ts             # 🚀 Express server setup
│       └── routers/             # 🔀 tRPC routers
│
├── 📂 workers/                   # ☁️ Cloudflare Workers entry
├── 📂 shared/                    # 🔗 Shared types (client ↔ server)
├── 📂 drizzle/                   # 🗄️ Database schema & migrations
│   ├── schema.ts                # 📊 Database models
│   └── migrations/              # 🔄 SQL migrations
│
└── 📂 dist/                      # 📤 Build output (gitignored)
```

---

## ⌨️ Key Commands

```bash
# 🏃 Development
npm run dev              # Start dev server (tsx watch + vite)

# 🏗️ Building
npm run build            # Production build (vite + esbuild)
npm run build:workers    # Build for Cloudflare Workers

# 🗄️ Database
npm run db:push          # Generate & run migrations

# 🚀 Deployment
npm run deploy           # Deploy to Cloudflare (staging)
npm run deploy:prod      # Deploy to production

# 🧪 Testing & Quality
npm run test             # Run Vitest tests
npm run check            # TypeScript type checking
npm run format           # Prettier formatting
```

---

## 🏗️ Architecture

### Database Layer (Drizzle ORM)
```typescript
📁 drizzle/schema.ts           // Single source of truth
📁 drizzle/migrations/         // Version-controlled schema
```
- **Local:** MySQL via `mysql2`
- **Production:** Cloudflare D1 (SQLite)
- **Tooling:** `drizzle-kit generate | migrate`

### API Layer (tRPC)
```typescript
📁 server/_core/routers/       // Your tRPC procedures
🔒 Context-based auth           // JWTs via cookies
✨ End-to-end type safety       // No more Zod nightmares!
```

### Frontend Layer
```typescript
📍 Wouter routing               // Lightweight & fast
🔄 TanStack Query              // Server state magic
🎨 shadcn/ui + Tailwind        // Beautiful UI out of the box
🔐 useAuth hook                // Authentication state
```

### Authentication Flow
```
User → JWT Token → Cookie → Protected Route
📝 jose library handles the heavy lifting
🔒 Protected routes check auth context
```

---

## ☁️ Deployment Strategy

### The 100% Free Stack™

| Service | Cost | What it does |
|---------|------|--------------|
| Cloudflare Pages | **$0** | Global CDN for frontend |
| Cloudflare Workers | **$0** | Serverless backend (tRPC) |
| Cloudflare D1 | **$0** | SQLite database |

**Total monthly cost:** $0.00 🎉

> 💡 See `DEPLOYMENT_FREE.md` for the complete setup guide

---

## 🔐 Environment Variables

Create a `.env` file from `.env.example`:

```bash
# Database
DATABASE_URL=            # Local MySQL connection

# Auth
JWT_SECRET=              # Your JWT secret key
COOKIE_SECRET=           # Cookie encryption key

# AI (optional)
OPENAI_API_KEY=          # For AI health assistant

# Cloudflare (deployment)
CLOUDFLARE_ACCOUNT_ID=   # Your Cloudflare account
CLOUDFLARE_API_TOKEN=    # API token for deployment
```

---

## 📋 Important Files

| File | Purpose |
|------|---------|
| `wrangler.toml` | ☁️ Cloudflare Workers config |
| `vite.config.ts` | ⚡ Vite bundler setup |
| `drizzle.config.ts` | 🗄️ Drizzle ORM config |
| `public/_redirects` | 🔄 SPA routing for Pages |
| `.env.example` | 🔐 Environment template |

---

## 🔄 Git Workflow

```bash
📦 main                    # Main branch
📝 Conventional commits    # Follow the standard
🪝 Pre-commit: Prettier    # Auto-format code
🧪 Pre-push: Vitest        # Run tests before push
```

### Commit Message Style
```bash
✅ Add: New features
🐛 Fix: Bug fixes
♻️ Refactor: Code changes
📝 Docs: Documentation
🎨 Style: Formatting
⚡ Perf: Performance
✅ Test: Tests
```

---

## 🎨 Features

- 🐾 **Multi-pet support** - Track all your pets in one place
- 💉 **Health records** - Vaccinations, medications, history
- 📅 **Smart scheduling** - Feeding times, medication reminders
- 📊 **Health analytics** - Weight tracking, trends
- 💰 **Expense tracking** - Know exactly what you're spending
- 🤖 **AI assistant** - Get health advice instantly
- 📱 **Fully responsive** - Works everywhere

---

<div align="center">

**Built with ❤️ for pet parents everywhere**

[Issues](https://github.com/TK7684/PetHealth/issues) • [Contributing](./CONTRIBUTING.md) • [License](MIT)

</div>
