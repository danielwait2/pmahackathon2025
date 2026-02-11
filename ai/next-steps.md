# Next Steps - Project Page Implementation

## Current Status
✅ Dashboard is complete and working
✅ Create project wizard works (POST /api/projects 200)
✅ Dashboard shows project cards
✅ Clicking projects opens `/project/[id]` (basic project page restored)

## What Needs to be Built Next

### Phase 4: Project Page (from phase-4-project-features.md)

The project page was deleted during the Supabase → NextAuth/Prisma migration. These components need to be rebuilt:

---

## Priority 1: Basic Project Page (CRITICAL - needed to unblock dashboard clicks)

### 1.1 Create the project page route
- [x] **File:** `app/project/[id]/page.tsx`
- [x] Server component that:
  - Gets session via `getServerSession(authOptions)`
  - Fetches project by ID from Prisma
  - Verifies user is a member (redirect to 404 if not)
  - Fetches project members, tasks, team agreement
  - Renders a basic layout with project info
- [x] **Minimal MVP:** Just show project name, description, deadline, member list for now
- [x] **Blocker:** This 404 is preventing users from viewing projects they create

### 1.2 Add project not-found page
- [x] **File:** `app/project/[id]/not-found.tsx`
- [x] Simple "Project not found" message with link back to dashboard

---

## Priority 2: Project Features (from old deleted code)

The following components were deleted and need rebuilding:

### 2.1 Project Header & Layout
- [x] `components/project/ProjectHeader.tsx` — Project name, deadline, invite code display
- [x] `components/project/ProjectTabs.tsx` — Tab navigation (Tasks, Availability, Team)

### 2.2 Tasks Tab
- [x] `components/project/TasksTab.tsx` — Container for task views
- [x] `components/project/TaskBoard.tsx` — Kanban board (todo/in_progress/done columns)
- [x] `components/project/TaskCard.tsx` — Individual task card (clickable, with metadata)
- [x] `components/project/TaskListView.tsx` — Mobile-friendly list view
- [x] `components/project/AddTaskModal.tsx` — Create/edit tasks
- [x] `components/project/TaskDetailModal.tsx` — View task details
- [x] **API Route:** `POST /api/tasks` — Create task
- [x] **API Route:** `PATCH /api/tasks/[id]` — Update task (status, assignee, etc.)
- [x] **API Route:** `DELETE /api/tasks/[id]` — Delete task

### 2.3 AI Task Suggestions (optional, nice-to-have)
- [ ] `components/project/AISuggestButton.tsx` — Button to trigger AI suggestions
- [ ] `components/project/TaskSuggestionsModal.tsx` — Show AI-generated tasks
- [ ] `app/api/suggest-tasks/route.ts` — Gemini API integration (was deleted)
- [ ] Needs `GEMINI_API_KEY` in `.env.local`

### 2.4 Availability Tab
- [x] `components/project/AvailabilityTab.tsx` — Container
- [x] `components/project/AvailabilityGrid.tsx` — Weekly calendar grid (click/drag time slots)
- [x] `components/project/availability-utils.ts` — Slot formatting helpers
- [x] `components/project/TeamAvailability.tsx` — Show all members' availability (heatmap view)
- [x] `components/project/MeetingFinder.tsx` — Algorithm to find best meeting times
- [x] **API Route:** `POST /api/availability` — Save user's availability slots
- [x] **API Route:** `GET /api/availability/[projectId]` — Get all members' availability

### 2.5 Team Tab
- [x] `components/project/TeamTab.tsx` — Container (includes member list with roles, join dates)
- [x] `components/project/TeamAgreement.tsx` — Display team agreement with "I Agree" functionality
- [x] `components/project/TeamAgreementEditor.tsx` — Edit agreement (owner only)
- [x] Show member list with roles, join dates (in TeamTab.tsx)
- [x] "I Agree" button for members to acknowledge agreement
- [x] **API Route:** `PATCH /api/team-agreement/[projectId]` — Update agreement
- [x] **API Route:** `GET /api/team-agreement/[projectId]` — Get team agreement
- [x] **API Route:** `POST /api/team-agreement/[projectId]/agree` — Member agrees to terms

---

## Priority 3: Join Flow (needs `/join/[code]` page)

### 3.1 Join by invite code page
- [x] **File:** `app/join/[code]/page.tsx`
- [x] Server component that:
  - Fetches project by invite code
  - If not logged in: show login prompt
  - If logged in: show project preview + "Join" button
  - On join: add to `project_members`, create `availability` row, redirect to project
- [x] Handle edge cases: invalid code, already member

---

## Recommended Order of Implementation

1. **Start here (unblock clicks):** Create basic `app/project/[id]/page.tsx` with minimal content
2. **Core features:** Build Tasks tab (most important for demo)
3. **Collaboration features:** Build Availability tab and Meeting Finder (unique selling point)
4. **Team features:** Build Team Agreement display/editing
5. **Polish:** Add AI suggestions, drag-and-drop, animations

---

## Technical Notes

### Missing UI Components (might need to install)
- Check if `dnd-kit` or `react-beautiful-dnd` is needed for drag-and-drop tasks
- May need `date-fns` for date formatting (already in package.json)

### Database Schema Check
Verify Prisma schema has all needed fields:
- `Task` — id, projectId, title, description, assignedTo, status, dueDate, orderIndex
- `Availability` — id, projectId, userId, slots (JSON string)
- `TeamAgreement` — id, projectId, responseTimeHours, meetingFrequency, communicationChannel, agreedBy (JSON array)

### API Routes Pattern
All API routes should:
- Use `getServerSession(authOptions)` for auth
- Return 401 if not authenticated
- Return 403 if user not a project member
- Use Prisma for all DB queries
- Return JSON responses

---

## Files Created So Far

### Phase 3 - Dashboard (Complete)
✅ `app/api/projects/route.ts`
✅ `app/api/projects/join/route.ts`
✅ `components/dashboard/EmptyState.tsx`
✅ `components/dashboard/ProjectCard.tsx`
✅ `components/dashboard/ProjectList.tsx`
✅ `components/dashboard/DashboardShell.tsx`
✅ `components/dashboard/CreateProjectWizard.tsx`
✅ `components/dashboard/JoinProjectModal.tsx`
✅ `app/dashboard/page.tsx`

### Phase 4 - Tasks Tab (Complete)
✅ `components/project/TaskBoard.tsx`
✅ `components/project/TaskCard.tsx`
✅ `components/project/TaskListView.tsx`
✅ `components/project/AddTaskModal.tsx`
✅ `components/project/TaskDetailModal.tsx`

### Phase 4 - Availability Tab (Complete)
✅ `components/project/availability-utils.ts`
✅ `components/project/AvailabilityGrid.tsx`
✅ `components/project/TeamAvailability.tsx`
✅ `components/project/MeetingFinder.tsx`
✅ `app/api/availability/route.ts`
✅ `app/api/availability/[projectId]/route.ts`

### Phase 4 - Team Tab (Complete)
✅ `components/project/TeamAgreement.tsx`
✅ `components/project/TeamAgreementEditor.tsx`
✅ `app/api/team-agreement/[projectId]/route.ts` (PATCH & GET)
✅ `app/api/team-agreement/[projectId]/agree/route.ts` (POST)

---

## Quick Start Command for Next Agent

```bash
# Start dev server (already running on port 3001)
cd groupsync && npm run dev -- --port 3001

# Create the critical missing file first
touch app/project/[id]/page.tsx
```

Then implement a minimal project page to unblock the 404 errors.
