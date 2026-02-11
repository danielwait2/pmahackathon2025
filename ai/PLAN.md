# GroupSync - Master Build Plan

> **Hackathon Format:** Weekend (48 hours)
> **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Supabase + Gemini API
> **Deployment:** Vercel

---

## How to Use This Plan

1. Work through phases **in order** (Phase 0 -> 7)
2. Each phase has its own file with detailed instructions and a checklist
3. **Check off items as you complete them** — if you stop, resume from the last unchecked item
4. The Master Checklist below tracks overall progress across all phases
5. Phases marked **MUST** are required for a viable demo; **SHOULD** are for polish

---

## Architecture Overview

```
groupsync/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── (auth)/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup page
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx      # User dashboard
│   │   ├── project/[id]/page.tsx   # Project view (tabbed)
│   │   └── join/[code]/page.tsx    # Join via invite code
│   └── api/
│       └── suggest-tasks/route.ts  # Gemini AI task suggestions
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── landing/                    # Landing page sections
│   ├── auth/                       # Auth forms, provider
│   ├── dashboard/                  # Dashboard, project cards, modals
│   └── project/                    # Project view components
├── lib/
│   ├── supabase.ts                 # Supabase client (browser + server)
│   ├── gemini.ts                   # Gemini API client
│   └── utils.ts                    # Shared utilities
├── types/
│   └── index.ts                    # TypeScript type definitions
├── scripts/
│   └── seed-demo.ts                # Demo data seeder
├── middleware.ts                    # Auth route protection
└── .env.local                      # Environment variables
```

---

## Evaluation Criteria Mapping

| Criteria | What Judges Want | How We Demonstrate |
|---|---|---|
| 1. Problem Definition & User Understanding | Evidence of real user research | Survey stats (31 responses) on landing page, persona-driven features |
| 2. Design & UX Quality | Clean, intuitive, professional | shadcn/ui, mobile-responsive, empty states, loading feedback |
| 3. Technical Considerations & Use of AI | Smart AI use in building AND product | Claude Code for dev, Gemini for in-product task suggestions |
| 4. Creativity in Solution | Novel approach, not cloning existing tools | Team Agreement "expectation contract", AI project kickoff |
| 5. Presentation & Communication | Clear story, concise demo | Demo-ready seed data, shareable invite flow, landing page story |

---

## Time Budget (48h Weekend)

| Phase | Est. Hours | Priority | Doc |
|---|---|---|---|
| 0. Scaffold | 0.5 | MUST | [phase-0-scaffold.md](phase-0-scaffold.md) |
| 1. Database & Auth | 1.5 | MUST | [phase-1-database-auth.md](phase-1-database-auth.md) |
| 2. Landing Page | 1.0 | MUST | [phase-2-landing-page.md](phase-2-landing-page.md) |
| 3. Dashboard & Project Creation | 2.5 | MUST | [phase-3-dashboard.md](phase-3-dashboard.md) |
| 4. Project Features (Core) | 4.0 | MUST | [phase-4-project-features.md](phase-4-project-features.md) |
| 5. Team Agreement | 1.5 | SHOULD | [phase-5-team-agreement.md](phase-5-team-agreement.md) |
| 6. Polish & Demo Prep | 2.0 | SHOULD | [phase-6-polish.md](phase-6-polish.md) |
| 7. Deployment | 0.5 | MUST | [phase-7-deployment.md](phase-7-deployment.md) |
| **Total Build** | **13.5** | | |
| **Buffer** (bugs, iteration, presentation) | **6.5** | | |
| **Remaining** (sleep, meals, breaks) | **28** | | |

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

---

## Master Checklist

Use this to track overall progress. Detailed checklists are in each phase file.

### Phase 0: Scaffold ✅
- [x] Next.js 14 project initialized with TypeScript
- [x] Tailwind CSS configured
- [x] shadcn/ui installed with required components
- [x] Supabase client library installed
- [x] Folder structure created
- [x] `npm run dev` works at localhost:3000

### Phase 1: Database & Auth ⚠️ (Code Complete - Needs Supabase Setup)
- [ ] Supabase project created, URL and anon key saved (MANUAL STEP REQUIRED)
- [ ] Database schema created (6 tables + RLS) (MANUAL STEP REQUIRED - SQL in phase-1-database-auth.md)
- [ ] RLS policies tested in Supabase dashboard (MANUAL STEP REQUIRED)
- [x] Supabase client setup (browser + server)
- [x] Signup flow working (creates profile) - CODE READY
- [x] Login flow working (redirects to dashboard) - CODE READY
- [x] Auth middleware protecting routes
- [x] AuthProvider context working

### Phase 2: Landing Page
- [ ] Hero section with headline and CTAs
- [ ] Problem section with survey stats (39%, 68%)
- [ ] Solution section with 4 feature cards
- [ ] How It Works section (3 steps)
- [ ] Final CTA section
- [ ] Mobile responsive
- [ ] CTAs link to auth pages

### Phase 3: Dashboard & Project Creation
- [ ] Dashboard page showing user's projects
- [ ] Project cards with name, deadline, members, progress
- [ ] Empty state for no projects
- [ ] Create Project wizard (3 steps: info, setup, invite)
- [ ] Invite code generation and copy
- [ ] Join Project modal with code input
- [ ] Join via URL (/join/[code]) working
- [ ] Edge cases handled (invalid code, already member)

### Phase 4: Project Features
- [ ] Project page with tabbed layout (Overview, Tasks, Availability, Team)
- [ ] Availability grid input (click/drag time slots)
- [ ] Availability saves to Supabase
- [ ] Team availability overlap visualization
- [ ] Meeting finder algorithm with top 5 suggestions
- [ ] Task board (Kanban with drag-and-drop)
- [ ] Task list view (mobile-friendly alternative)
- [ ] Task CRUD (create, read, update, delete)
- [ ] AI task suggestions via Gemini API
- [ ] Graceful fallback if no API key

### Phase 5: Team Agreement
- [ ] Team members list with roles
- [ ] Team Agreement display card
- [ ] Owner can edit agreement
- [ ] Members can "I Agree"
- [ ] Agreement status tracking (X of Y agreed)
- [ ] Re-agreement required after owner edits

### Phase 6: Polish & Demo Prep
- [ ] Empty states for all sections
- [ ] Loading states (skeletons, spinners)
- [ ] Toast notifications for key actions
- [ ] Error handling (network, validation, 404)
- [ ] Mobile optimization pass
- [ ] Demo seed data script
- [ ] Full end-to-end flow tested

### Phase 7: Deployment
- [ ] Vercel deployment successful
- [ ] Environment variables set in Vercel
- [ ] Production URL working
- [ ] Auth works in production
- [ ] Database connected in production
- [ ] Invite links work with production URL
- [ ] Backup demo video recorded

---

## Presentation Talking Points

When presenting, emphasize HOW you used AI:

1. **Survey Analysis:** "We used Claude to analyze 31 survey responses and identify that scheduling (39%) was the #1 pain point"
2. **Architecture:** "We used Claude Code to scaffold our Next.js project and design our database schema"
3. **Component Development:** "We pair-programmed with Claude Code/Cursor to build our availability algorithm and task management system"
4. **In-Product AI:** "Our product uses Gemini AI to suggest task breakdowns based on project type, saving students time on planning"
5. **Iteration:** "When user testing revealed issues, we used Claude to quickly refactor components"

This shows judges you used AI as a "multiplier for product thinking."
