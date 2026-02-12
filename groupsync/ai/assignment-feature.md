# GroupSync – Assignment Add-on Feature

> **For AI agents:** This document describes how to add assignments as a project type. Read this file before starting work. Follow the same format as `IMPROVEMENTS-TODO.md`.

---

## Summary

| #   | Feature                                     | Priority | Effort | Status     |
| --- | ------------------------------------------- | -------- | ------ | ----------- |
| 1   | Add assignments (project variant, no tasks) | High     | Medium | ✅ Complete |

---

## Implementation Steps (check off as completed)

### Step 1: Schema change
- [x] Add `isAssignment Boolean @default(false)` to Project in `prisma/schema.prisma`
- [x] Run `prisma db push` (or migrate)

### Step 2: Update creation flow
- [x] Add type selector (Project / Assignment) at start of step 1 in CreateProjectWizard
- [x] Store `isAssignment` in state; pass to API
- [x] Wizard title and button text adapt based on selection

### Step 3: Update project page
- [x] Pass `isAssignment={project.isAssignment}` to ProjectTabs and ProjectHeader
- [x] ProjectTabs: add `isAssignment` prop; hide Tasks tab when true
- [x] ProjectTabs: default tab to "availability" when assignment

### Step 4: Update ProjectHeader
- [x] Add `isAssignment` prop; show "Assignment" badge when true

### Step 5: Dashboard / project list
- [x] Include `isAssignment` in dashboard project data
- [x] ProjectCard: show "Assignment" badge; hide task progress when `isAssignment`

### Step 6: API and types
- [x] POST /api/projects accepts `isAssignment`; save to project
- [x] Add `isAssignment` to Project and DashboardProject interfaces

---

## Context

Users need two types of collaborative spaces:

- **Project** – Full-featured: tasks/boards, availability, meetings, team
- **Assignment** – Lightweight: invite members, set availability, find meeting times. No tasks. Ideal for coordinating when to meet (e.g. study sessions, group work sessions) without task tracking.

Both use the same underlying Project model with an `isAssignment` flag. The project page renders differently based on this flag.

---

## What to build

1. **Schema** – Add `isAssignment Boolean @default(false)` to Project
2. **Creation flow** – Allow creating an assignment (instead of a project) via wizard; same invite flow
3. **Project page** – Conditional layout:
   - **Project** (`isAssignment: false`): Tasks, Availability, Team tabs (current behavior)
   - **Assignment** (`isAssignment: true`): Availability, Team tabs only (no Tasks tab)
4. **Meeting features** – Assignments retain: availability grid, meeting finder, schedule meetings, upcoming meetings
5. **No tasks** – Assignments do not show task UI; no task creation, board, or list views

---

## Technical implementation

### Step 1: Schema change

**File:** `prisma/schema.prisma`

```prisma
model Project {
  // ... existing fields
  isAssignment  Boolean   @default(false) @map("is_assignment")
  // ...
}
```

- Run `npx prisma migrate dev --name add_project_is_assignment`

### Step 2: Update creation flow

**File:** `components/dashboard/CreateProjectWizard.tsx` (or create `CreateAssignmentWizard.tsx`)

**Option A – Single wizard with type selector (recommended):**

- Add a type selector at the start of step 1: "Project" or "Assignment" (radio or toggle)
- Store `isAssignment` in state; pass to API in `handleCreateProject`
- Wizard title: "Create Project" or "Create Assignment" based on selection
- Step 2 (preferences) and step 3 (invite) remain the same for both

**Option B – Separate entry points:**

- Add "Create Assignment" button alongside "Create Project" on dashboard
- Reuse wizard logic but always pass `isAssignment: true` when creating from that flow

**API:** `POST /api/projects` – Accept `isAssignment` in body; default to `false` if omitted.

### Step 3: Update project page

**File:** `app/project/[id]/page.tsx`

- Include `isAssignment` in project fetch (already on model)
- Pass `isAssignment={project.isAssignment}` to `ProjectTabs`
- For assignments: do not pass `tasks` (or pass empty array); `ProjectTabs` will hide Tasks tab

**File:** `components/project/ProjectTabs.tsx`

- Add prop: `isAssignment?: boolean`
- When `isAssignment` is true:
  - Hide "Tasks" tab
  - Default tab to "availability" instead of "tasks"
  - Do not render `TasksTab` or pass tasks-related props
- When `isAssignment` is false: current behavior (Tasks, Availability, Team)

### Step 4: Update ProjectHeader and labels

**File:** `components/project/ProjectHeader.tsx`

- Optionally: show "Assignment" badge or different subtitle when `isAssignment`
- Or keep header identical; the tab layout is the main difference

### Step 5: Dashboard / project list

**File:** `app/dashboard/page.tsx`

- Include `isAssignment` in project queries and serialization
- Pass to `ProjectCard` so it can display differently (e.g. "Assignment" label, hide task progress)

**File:** `components/dashboard/ProjectCard.tsx`

- Add `isAssignment?: boolean` prop
- When `isAssignment`: hide or adapt task progress (e.g. "No tasks" or show member count only)

### Step 6: API and types

**File:** `app/api/projects/route.ts` (POST)

- Accept `isAssignment` in body
- Pass to `prisma.project.create({ data: { ..., isAssignment: body.isAssignment ?? false } })`

**File:** `types/index.ts`

- Add `isAssignment?: boolean` to `Project` and `DashboardProject` interfaces

---

## Files to create

| File                     | Purpose |
| ------------------------ | ------- |
| (None – extend existing) |         |

---

## Files to modify

| File                                           | Changes                                                                           | Status |
| ---------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| `prisma/schema.prisma`                         | Add `isAssignment Boolean @default(false)` to Project                             | [x]    |
| `app/api/projects/route.ts`                    | Accept and save `isAssignment` on create                                          | [x]    |
| `types/index.ts`                               | Add `isAssignment` to Project interfaces                                          | [x]    |
| `components/dashboard/CreateProjectWizard.tsx` | Add type selector (Project vs Assignment); pass `isAssignment` to API             | [x]    |
| `app/project/[id]/page.tsx`                    | Pass `isAssignment` to ProjectTabs and ProjectHeader                              | [x]    |
| `components/project/ProjectTabs.tsx`           | Add `isAssignment` prop; hide Tasks tab when true; default to availability tab    | [x]    |
| `app/dashboard/page.tsx`                       | Include `isAssignment` in project data                                            | [x]    |
| `components/dashboard/ProjectCard.tsx`         | Handle `isAssignment` – hide task progress, show assignment label                 | [x]    |
| `components/project/ProjectHeader.tsx`         | Show "Assignment" badge when `isAssignment`                                       | [x]    |

---

## Project page layout comparison

| Tab / Section     | Project | Assignment |
| ----------------- | ------- | ---------- |
| Tasks             | ✓ Shown | ✗ Hidden   |
| Availability      | ✓ Shown | ✓ Shown    |
| Team              | ✓ Shown | ✓ Shown    |
| Meeting finder    | ✓       | ✓          |
| Schedule meeting  | ✓       | ✓          |
| Upcoming meetings | ✓       | ✓          |
| Invite members    | ✓       | ✓          |

---

## Verification

- [x] Migration runs; `isAssignment` column exists on projects
- [x] User can create an assignment via wizard (type selector or separate flow)
- [x] New assignment has invite code and can invite others
- [x] Assignment project page shows Availability and Team tabs only (no Tasks)
- [x] Default tab on assignment page is Availability
- [x] Assignment has meeting finder and can schedule meetings
- [x] Project (non-assignment) page unchanged: Tasks, Availability, Team
- [x] Dashboard shows assignments; project cards adapt (e.g. no task progress for assignments)
- [x] API returns `isAssignment` for projects; types updated

---

## Related Files

- `groupsync/ai/IMPROVEMENTS-TODO.md`
- `groupsync/ai/class-feature.md`
- `groupsync/AGENTS.md`
