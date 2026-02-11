# Phase 3: Dashboard & Project Creation (NextAuth/Prisma Rebuild)

> **Status:** COMPLETE
> **Stack Change:** Migrated from Supabase to NextAuth + Prisma (SQLite)
> **Prerequisites:** Phase 1 complete (auth + database working via NextAuth/Prisma)

---

## What Changed

The dashboard was originally built with Supabase client-side queries. It has been migrated to:
- **Auth:** NextAuth with credentials provider (JWT sessions)
- **Database:** Prisma with SQLite
- **API:** Server-side API routes instead of direct Supabase client calls

---

## Implementation Steps

### 3.1 Add missing shadcn UI components
- [x] Install: dialog, badge, calendar, popover, select, textarea, separator, skeleton, tabs

### 3.2 Create API routes
- [x] `POST /api/projects` — Create project + owner membership + team agreement
- [x] `POST /api/projects/join` — Look up project by invite code, check membership, add member

### 3.3 Rebuild dashboard components
- [x] `components/dashboard/EmptyState.tsx` — Pure UI (reuse as-is)
- [x] `components/dashboard/ProjectCard.tsx` — Pure UI (reuse as-is, uses DashboardProject type)
- [x] `components/dashboard/ProjectList.tsx` — Pure UI (reuse as-is)
- [x] `components/dashboard/DashboardShell.tsx` — Swap supabase.auth.signOut() → NextAuth signOut()
- [x] `components/dashboard/CreateProjectWizard.tsx` — Replace Supabase inserts with fetch('/api/projects')
- [x] `components/dashboard/JoinProjectModal.tsx` — Replace Supabase queries with fetch('/api/projects/join')

### 3.4 Rewrite dashboard page
- [x] `app/dashboard/page.tsx` — Use getServerSession() + Prisma queries, map to DashboardProject[]

### 3.5 Verify
- [x] Dashboard compiles and loads (GET /dashboard 200)
- [ ] Empty state shows when no projects (needs manual QA)
- [ ] Create project wizard works end-to-end (needs manual QA)
- [ ] Join project modal works (needs manual QA)
- [ ] Logout works (needs manual QA)
