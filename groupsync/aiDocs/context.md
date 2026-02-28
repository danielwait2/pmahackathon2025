# GroupSync Project Context

> **Quick reference for AI agents.** Read this for high-level understanding before diving into code.

---

## 📖 Project Overview

**GroupSync** is a student collaboration app that helps group project teams:
- **Schedule meetings** - Find times when everyone is available
- **Manage tasks** - Track who's doing what and when
- **Set expectations** - Create team agreements upfront
- **Share progress** - Keep everyone aligned

**Target Users:** College students working on group projects
**Status:** Post-hackathon, continuing development
**Deployed:** Vercel (frontend), Neon (database)

---

## 🎯 Current Focus

**Active Development:**
- Calendar integration (Google Calendar, Outlook, Apple Calendar)
- Combining Team View + Meeting Finder into one page
- Onboarding tutorial for first-time users
- Task due dates and reminders

**See:** `ai/roadmaps/` for detailed task tracking

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14.1 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.2
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Date Handling:** date-fns, react-day-picker
- **Notifications:** Sonner (toast)

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma 5.22
- **Auth:** NextAuth.js 4.24 (credentials provider)
- **Password Hashing:** bcryptjs

### Deployment
- **Frontend:** Vercel (auto-deploy from main branch)
- **Database:** Neon (serverless PostgreSQL)
- **Environment:** Production URL managed via Vercel

### Development
- **Package Manager:** npm
- **Linting:** ESLint (Next.js config)
- **Type Checking:** TypeScript strict mode
- **Dev Server:** Port 3000 (`npm run dev`)

---

## 📁 Project Structure

```
groupsync/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth routes (login, signup)
│   ├── (dashboard)/          # Protected routes
│   │   ├── dashboard/        # Main dashboard
│   │   └── project/[id]/     # Project detail view
│   ├── join/[code]/          # Invite code join flow
│   ├── share/[token]/        # Public project sharing
│   ├── api/                  # API routes
│   │   ├── auth/             # NextAuth endpoints
│   │   ├── projects/         # Project CRUD
│   │   ├── tasks/            # Task management
│   │   ├── availability/     # Availability slots
│   │   ├── meetings/         # Meeting scheduling
│   │   └── classes/          # Class management
│   └── page.tsx              # Landing page
│
├── components/
│   ├── auth/                 # Login/signup forms
│   ├── dashboard/            # Dashboard components
│   ├── landing/              # Landing page sections
│   ├── onboarding/           # First-time user tour
│   ├── project/              # Project view components
│   ├── share/                # Public sharing components
│   └── ui/                   # shadcn/ui base components
│
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Prisma client instance
│   ├── utils.ts              # Utility functions
│   └── calendar-utils.ts     # Calendar export helpers
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── types/
│   └── index.ts              # TypeScript type definitions
│
├── aiDocs/                   # TRACKED: Shared team knowledge
│   ├── context.md            # This file
│   ├── architecture.md       # System design
│   ├── api-guide.md          # API reference
│   ├── component-library.md  # Component catalog
│   ├── database-schema.md    # Schema reference
│   ├── auth-flow.md          # Auth details
│   ├── deployment.md         # Deploy process
│   └── coding-standards.md   # Style guide
│
└── ai/                       # GITIGNORED: Personal workspace
    ├── guides/               # Library docs
    ├── roadmaps/             # Phase plans
    └── notes/                # Personal notes
```

---

## 🔑 Key Architectural Decisions

### Server vs Client Components
- **Default to Server Components** for data fetching
- **Client Components** only when needed for:
  - User interactions (forms, buttons, modals)
  - Browser APIs (localStorage, etc.)
  - State management (useState, useContext)

### Data Flow
1. **Server Components** fetch data directly with Prisma
2. **API Routes** handle mutations (POST, PUT, DELETE)
3. **Client Components** call API routes and revalidate
4. **Optimistic Updates** for better UX (task status, etc.)

### Authentication
- NextAuth.js with credentials provider
- Session stored in JWT
- Middleware protects routes starting with `/dashboard` and `/project`
- Guest access supported for availability (via guestMemberId)

### Database Access
- All queries through Prisma ORM
- Use `lib/db.ts` singleton for Prisma client
- Transactions for multi-step operations
- RLS-style filtering in queries (check user permissions)

---

## 📚 Reference Documentation

### Main Planning Docs
- **Hackathon Build Guide:** `../general_plan.md`
- **Feature Tracking:** `ai/IMPROVEMENTS-TODO.md`, `ai/IMPROVEMENTS-CHECKLIST.md`
- **Roadmaps:** `ai/roadmaps/`

### AI Orchestration
- **Universal Instructions:** `../.ai/CLAUDE.md`
- **Git Workflows:** `../.ai/WORKFLOWS.md`

### Code Reference
- **Architecture:** [architecture.md](./architecture.md)
- **API Guide:** [api-guide.md](./api-guide.md)
- **Component Library:** [component-library.md](./component-library.md)
- **Database Schema:** [database-schema.md](./database-schema.md)
- **Auth Flow:** [auth-flow.md](./auth-flow.md)
- **Deployment:** [deployment.md](./deployment.md)
- **Coding Standards:** [coding-standards.md](./coding-standards.md)

---

## 🚀 Getting Started (for new developers/agents)

1. **Read AI instructions first:**
   - `../.ai/CLAUDE.md` - Behavioral guidelines
   - `../.ai/WORKFLOWS.md` - Git and commit rules

2. **Understand the project:**
   - This file (`context.md`) - High-level overview
   - `architecture.md` - System design
   - `database-schema.md` - Data model

3. **Check current work:**
   - `ai/roadmaps/` - What's in progress
   - `ai/IMPROVEMENTS-TODO.md` - Pending tasks

4. **Set up locally:**
   ```bash
   cd groupsync
   npm install
   cp .env.example .env.local  # Add your DATABASE_URL
   npm run dev
   ```

5. **Before making changes:**
   - Follow `../.ai/WORKFLOWS.md` strictly
   - Run pre-commit checks
   - Update relevant docs in `aiDocs/`

---

## 🎨 Design Principles

### User Experience
- **Speed:** Fast page loads, optimistic updates
- **Simplicity:** No complex setup, works immediately
- **Mobile-First:** Responsive design, touch-friendly
- **Helpful:** Empty states, loading indicators, error messages

### Code Quality
- **TypeScript Strict:** No `any`, proper types
- **Component Focus:** Single responsibility
- **Reusability:** Extract common patterns
- **Performance:** Server components, efficient queries

### Team Workflow
- **No Over-Engineering:** Build what's needed, nothing more
- **Documentation:** Keep aiDocs updated
- **Review:** Verification agent before commits
- **Communication:** Ask before major changes

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team

---

## 2026-02-28 Archive Behavior

- Joining archived projects remains allowed through existing join/share flows.
- Archiving affects dashboard visibility only (Active vs Past).
- Archived projects stay fully editable and accessible via direct project URL.
