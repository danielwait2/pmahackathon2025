# Phase 0: Project Scaffold

> **Time Estimate:** 30 minutes
> **Priority:** MUST
> **Prerequisites:** Node.js 18+, npm/pnpm

---

## Goal

Initialize a fully configured Next.js 14 project with all dependencies installed, folder structure created, and dev server running.

---

## Steps

### 0.1 Create Next.js Project

```bash
npx create-next-app@latest groupsync --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd groupsync
```

Options to select during setup:
- TypeScript: **Yes**
- ESLint: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **No** (keep flat app/ structure)
- App Router: **Yes**
- Import alias: `@/*`

### 0.2 Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then install required components:

```bash
npx shadcn-ui@latest add button card input dialog tabs avatar badge dropdown-menu form toast label textarea select separator skeleton popover calendar
```

### 0.3 Install Additional Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install lucide-react
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install date-fns
npm install @google/generative-ai
```

Package purposes:
- `@supabase/supabase-js` + `@supabase/ssr` — Supabase client for browser and server
- `lucide-react` — Icon library
- `@dnd-kit/*` — Drag-and-drop for task board
- `date-fns` — Date formatting and manipulation
- `@google/generative-ai` — Gemini API client for AI task suggestions

### 0.4 Create Folder Structure

Create the following directories and placeholder files:

```
app/
  page.tsx                          # Landing page (exists from create-next-app)
  layout.tsx                        # Root layout (exists)
  globals.css                       # Global styles (exists)
  (auth)/
    login/page.tsx                  # Login page
    signup/page.tsx                 # Signup page
  (dashboard)/
    dashboard/page.tsx              # User dashboard
    project/[id]/page.tsx           # Project view
    join/[code]/page.tsx            # Join via invite code
  api/
    suggest-tasks/route.ts          # Gemini API endpoint

components/
  ui/                               # shadcn components (auto-populated)
  landing/
    HeroSection.tsx
    ProblemSection.tsx
    SolutionSection.tsx
    HowItWorksSection.tsx
    CTASection.tsx
  auth/
    LoginForm.tsx
    SignupForm.tsx
    AuthProvider.tsx
  dashboard/
    ProjectCard.tsx
    ProjectList.tsx
    EmptyState.tsx
    CreateProjectWizard.tsx
    JoinProjectModal.tsx
  project/
    ProjectHeader.tsx
    ProjectTabs.tsx
    AvailabilityTab.tsx
    AvailabilityGrid.tsx
    TeamAvailability.tsx
    MeetingFinder.tsx
    TasksTab.tsx
    TaskBoard.tsx
    TaskCard.tsx
    TaskDetailModal.tsx
    TaskListView.tsx
    AddTaskModal.tsx
    TeamTab.tsx
    TeamAgreement.tsx
    TeamAgreementEditor.tsx
    AISuggestButton.tsx
    TaskSuggestionsModal.tsx

lib/
  supabase.ts                       # Supabase client config
  gemini.ts                         # Gemini API client config
  utils.ts                          # Shared utilities (exists from shadcn)

types/
  index.ts                          # TypeScript type definitions

scripts/
  seed-demo.ts                      # Demo data seeder (Phase 6)

middleware.ts                        # Auth route protection
```

### 0.5 Create Environment File

Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
GEMINI_API_KEY=
```

Add `.env.local` to `.gitignore` (should already be there from create-next-app).

### 0.6 Create Type Definitions

In `types/index.ts`, define the core types that will be used across the app:

```typescript
export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface AvailabilitySlot {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
}

export interface Availability {
  id: string;
  project_id: string;
  user_id: string;
  slots: AvailabilitySlot[];
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: 'todo' | 'in_progress' | 'done';
  due_date: string | null;
  order_index: number;
  created_at: string;
  assignee?: Profile;
}

export interface TeamAgreement {
  id: string;
  project_id: string;
  response_time_hours: number;
  meeting_frequency: string | null;
  communication_channel: string | null;
  quality_standards: string | null;
  agreed_by: string[];
  updated_at: string;
}

export interface MeetingSuggestion {
  day: number;
  dayName: string;
  start: string;
  end: string;
  duration: number; // in minutes
  availableMembers: string[];
  totalMembers: number;
}

export interface AISuggestedTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'high' | 'medium' | 'low';
}
```

### 0.7 Verify Setup

```bash
npm run dev
```

Confirm:
- Dev server starts on localhost:3000
- No build errors
- Default Next.js page renders

---

## Checklist

- [ ] Next.js 14 project created with TypeScript + Tailwind + App Router
- [ ] shadcn/ui initialized and all required components installed
- [ ] Supabase client libraries installed
- [ ] Lucide React icons installed
- [ ] dnd-kit installed (for task board drag-and-drop)
- [ ] date-fns installed
- [ ] @google/generative-ai installed (for Gemini)
- [ ] Full folder structure created (app/, components/, lib/, types/, scripts/)
- [ ] .env.local created with placeholder variables
- [ ] Type definitions written in types/index.ts
- [ ] `npm run dev` runs successfully at localhost:3000
- [ ] No console errors in browser

---

## Next Phase

When all items are checked, proceed to [Phase 1: Database & Auth](phase-1-database-auth.md).
