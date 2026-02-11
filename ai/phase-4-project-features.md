# Phase 4: Project Features (Core)

> **Time Estimate:** 4 hours
> **Priority:** MUST
> **Prerequisites:** Phase 1 + Phase 3 complete
> **Rubric:** Problem Definition (scheduling = #1 pain point), Technical & AI (Gemini task suggestions), Creativity (meeting finder algorithm)

---

## Goal

Build the core project view with tabbed navigation, availability scheduling (When2Meet-style), task management (Kanban board), and AI-powered task suggestions.

---

## Steps

### 4.1 Project Page Layout

**`app/(dashboard)/project/[id]/page.tsx`** — Server Component

1. Fetch project by ID from Supabase
2. Verify current user is a member (if not → 404 or redirect)
3. Fetch: project details, members with profiles, tasks, availability, team agreement
4. Pass data to client layout component

**`components/project/ProjectHeader.tsx`**

Displays:
- Project name (large heading)
- Deadline badge (same color coding as dashboard card)
- "Invite" button → shows invite code/link in a popover
- Settings dropdown (owner only): Edit project, Delete project

**`components/project/ProjectTabs.tsx`** — Client Component

Tab navigation with 4 tabs:
- **Overview** — Summary stats, team agreement preview, quick info
- **Tasks** — Kanban board / list view for task management
- **Availability** — Schedule input and team overlap visualization
- **Team** — Member list, team agreement management

Use shadcn `Tabs` component. URL-synced tabs (optional but nice — use query params or hash).

**Overview tab content:**
- Quick stats cards: "X tasks done", "Y in progress", "Z team members"
- Team Agreement summary card (preview of current agreement, link to Team tab)
- Upcoming deadlines (tasks due soon)

---

### 4.2 Availability Feature (When2Meet-Style)

This is the **most critical feature** — scheduling was the #1 pain point (39%) from the survey.

#### 4.2.1 Availability Grid (Input)

**`components/project/AvailabilityGrid.tsx`** — Client Component

A weekly grid where users mark when they're free:

**Grid structure:**
- **Columns:** Mon, Tue, Wed, Thu, Fri, Sat, Sun (7 columns)
- **Rows:** Time slots from 8:00 AM to 10:00 PM in **30-minute increments** (28 rows)
- **Cell size:** ~40px wide x ~20px tall (desktop), adjust for mobile

**Interaction:**
- **Click** a cell to toggle it (free ↔ unavailable)
- **Click and drag** to select multiple cells at once (set all to free)
  - Track `mousedown` → `mousemove` → `mouseup` events
  - On mousedown: record starting cell, determine if toggling ON or OFF
  - On mousemove: apply same toggle to all cells in rectangular selection
  - On mouseup: finalize selection
- **Visual states:**
  - Available: green background (`emerald-400`)
  - Unavailable: light gray (`gray-100`)
  - Hovering: slightly darker shade

**Mobile alternative:**
Since a 7x28 grid is hard to use on small screens, provide a **list-based input** on mobile:
- For each day of the week, show a row with:
  - Day name
  - "Add time range" button
  - Time range inputs: start time (dropdown) — end time (dropdown)
  - Multiple ranges per day allowed
  - "Remove" button for each range

**Save behavior:**
- "Save Availability" button at the bottom
- Converts grid state to `AvailabilitySlot[]` format:
  ```json
  [
    { "day": 1, "start": "09:00", "end": "12:00" },
    { "day": 1, "start": "14:00", "end": "17:00" },
    { "day": 3, "start": "10:00", "end": "15:00" }
  ]
  ```
- Upserts to `availability` table (unique on project_id + user_id)
- Toast: "Availability saved!"

**Loading existing data:**
- On mount, fetch user's existing availability for this project
- Pre-fill the grid with saved slots

#### 4.2.2 Team Availability Overlap

**`components/project/TeamAvailability.tsx`** — Client Component

Read-only visualization showing when team members overlap:

**Same grid layout as input**, but:
- Cells are colored by **how many people are free**:
  - All members free: dark green (`emerald-600`) — "Best time"
  - Most members free (>50%): medium green (`emerald-400`)
  - Some members free: light green (`emerald-200`)
  - No one free: white/gray
- **Hover/click a cell** → tooltip showing exactly who is free:
  - "Available: Alice, Bob"
  - "Unavailable: Carol"

**Legend:**
- Color scale bar showing "No one" → "Everyone" with member count labels

**Algorithm for computing overlap:**

```
For each cell (day, timeSlot):
  count = 0
  available_names = []
  For each member's availability:
    If member has a slot covering this (day, timeSlot):
      count++
      available_names.push(member.name)
  cell.intensity = count / total_members
  cell.tooltip = available_names
```

#### 4.2.3 Meeting Finder

**`components/project/MeetingFinder.tsx`** — Client Component

Algorithm to find the best meeting times:

**Input:** All members' availability slots

**Algorithm:**
1. For each day (0-6):
   - Find all 30-min slots where **all members** are free
   - Merge consecutive slots into continuous blocks
   - Each block = a potential meeting time
2. If no slots with ALL members, relax to "all but 1 member"
3. **Rank suggestions by:**
   - Number of available members (more = better)
   - Duration of continuous block (longer = better, cap at 2 hours)
   - Time of day preference (afternoon 1-5pm slightly preferred over morning)
4. Return **top 5 suggestions**

**Display:**
- "Find Best Meeting Times" button
- Results shown as cards:
  - Day name + time range (e.g., "Tuesday 2:00 PM — 4:00 PM")
  - Duration (e.g., "2 hours")
  - Who's available: avatar stack
  - If not everyone: "Missing: Carol" in muted text
- **"Schedule This"** button on each card (owner only) — saves selected time to project

**Edge case — no overlap:**
- Message: "No times where everyone is free."
- Show partial matches: "Best options with 3 of 4 members:"
- Let owner proceed with partial availability

#### 4.2.4 Availability Tab Assembly

**`components/project/AvailabilityTab.tsx`** — Client Component

Layout:
- Two sections side-by-side on desktop, stacked on mobile:
  - Left: "Your Availability" → `<AvailabilityGrid />`
  - Right: "Team Availability" → `<TeamAvailability />`
- Below: "Find Meeting Times" → `<MeetingFinder />`

If user hasn't submitted availability yet:
- Show prompt: "Add your availability so your team can find meeting times"
- Still show team overlap (other members' data)

---

### 4.3 Task Management

#### 4.3.1 Tasks Tab

**`components/project/TasksTab.tsx`** — Client Component

Header:
- Toggle: "Board" | "List" view (use shadcn `Tabs` or buttons)
- "Add Task" button → opens `<AddTaskModal />`
- "Suggest Tasks with AI" button → triggers Gemini suggestions

Renders either `<TaskBoard />` or `<TaskListView />` based on toggle.

#### 4.3.2 Task Board (Kanban)

**`components/project/TaskBoard.tsx`** — Client Component

Three columns: **To Do** | **In Progress** | **Done**

**Uses `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop:**

Setup:
```tsx
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
```

Structure:
- `<DndContext>` wraps the board
- Each column is a droppable area with a `<SortableContext>`
- Each task card is a sortable/draggable item
- On `onDragEnd`: update task status in Supabase, update local state optimistically

**Column design:**
- Column header: status name + count badge
- Scrollable if many tasks
- "Add task" shortcut at bottom of "To Do" column

#### 4.3.3 Task Card

**`components/project/TaskCard.tsx`** — Client Component

Compact card showing:
- Drag handle (6-dot grip icon)
- Task title (bold, truncated)
- Assigned to: small avatar or "Unassigned" muted badge
- Due date: "Due Mon" or "Overdue" red badge
- Click → opens `<TaskDetailModal />`

#### 4.3.4 Task Detail Modal

**`components/project/TaskDetailModal.tsx`** — Client Component

Full task editor in a dialog:
- Title: editable text input
- Description: textarea
- Assigned to: dropdown of project members (name + avatar)
- Due date: date picker (shadcn Calendar + Popover)
- Status: dropdown (To Do, In Progress, Done)
- "Save" button — updates task in Supabase
- "Delete" button — confirmation dialog, then deletes

#### 4.3.5 Task List View

**`components/project/TaskListView.tsx`** — Client Component

Simpler view, better for mobile:
- Grouped by status with section headers
- Each row: checkbox (toggle done), title, assignee avatar, due date
- Click row → opens `<TaskDetailModal />`
- Checkbox toggles between 'todo' and 'done' (or 'in_progress' and 'done')

#### 4.3.6 Add Task Modal

**`components/project/AddTaskModal.tsx`** — Client Component

Quick-add form:
- Title (required)
- Description (optional)
- Assign to (optional, dropdown of members)
- Due date (optional, date picker)
- "Add Task" button
- On submit: insert into `tasks` table, close modal, refresh list
- Toast: "Task added!"

---

### 4.4 AI Task Suggestions (Gemini)

#### 4.4.1 Gemini Client Setup

**`lib/gemini.ts`:**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash', // fast and cheap
});
```

#### 4.4.2 API Route

**`app/api/suggest-tasks/route.ts`:**

```typescript
import { geminiModel } from '@/lib/gemini';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectName, description, deadline } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI suggestions not configured' },
        { status: 503 }
      );
    }

    const prompt = `You are helping a student team break down a group project into actionable tasks.

Project: ${projectName}
Description: ${description || 'No description provided'}
Deadline: ${deadline || 'No deadline set'}

Generate 5-7 specific, actionable tasks. For each task provide:
- title: short task name (under 50 characters)
- description: one sentence explaining what needs to be done
- estimatedHours: rough time estimate as a number
- priority: "high", "medium", or "low"

Focus on typical student project phases: research, planning, drafting, implementation, review, finalization.

Return ONLY a valid JSON array, no markdown, no explanation. Example format:
[{"title": "...", "description": "...", "estimatedHours": 2, "priority": "high"}]`;

    const result = await geminiModel.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response (strip markdown code fences if present)
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const tasks = JSON.parse(cleaned);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
```

#### 4.4.3 AI Suggest Button

**`components/project/AISuggestButton.tsx`** — Client Component

- Button: "Suggest Tasks with AI" with sparkle icon
- Loading state: "Generating suggestions..." with spinner
- On click: POST to `/api/suggest-tasks` with project name, description, deadline
- On success: open `<TaskSuggestionsModal />` with results
- On error: toast "AI suggestions aren't available right now"

#### 4.4.4 Task Suggestions Modal

**`components/project/TaskSuggestionsModal.tsx`** — Client Component

Shows AI-generated task suggestions:
- Title: "AI-Suggested Tasks"
- List of suggestion cards, each with:
  - Task title (bold)
  - Description (muted)
  - Estimated hours badge
  - Priority badge (red=high, yellow=medium, green=low)
  - "Add" button → creates task in Supabase, marks card as added
  - Visual state change when added (checkmark, grayed out)
- "Add All" button at bottom → bulk-creates all tasks
- "Close" to dismiss

**Graceful fallback if no GEMINI_API_KEY:**
- The button should still render but show a tooltip or message: "AI suggestions require a Gemini API key. Add GEMINI_API_KEY to your environment."
- The app should never crash due to missing API key

---

## Checklist

### Project Layout
- [x] `app/(dashboard)/project/[id]/page.tsx` - fetches project data, verifies membership
- [x] `components/project/ProjectHeader.tsx` - name, deadline, invite button, settings
- [x] `components/project/ProjectTabs.tsx` - 4 tabs: Overview, Tasks, Availability, Team
- [x] Overview tab: quick stats, agreement preview, upcoming deadlines

### Availability (When2Meet-style)
- [x] `components/project/AvailabilityTab.tsx` - layout container
- [x] `components/project/AvailabilityGrid.tsx` - weekly grid input
- [x] Grid: 7 columns (Mon-Sun) x 28 rows (8AM-10PM, 30-min slots)
- [x] Click to toggle cells
- [x] Click-and-drag to select multiple cells
- [x] Green = available, gray = unavailable
- [x] Mobile: list-based time range input alternative
- [x] Save button - upserts to Supabase `availability` table
- [x] Loads existing availability on mount
- [x] `components/project/TeamAvailability.tsx` - overlap visualization
- [x] Color intensity based on how many members are free
- [x] Hover/click tooltip showing who is available
- [x] Legend showing color scale
- [x] `components/project/MeetingFinder.tsx` - algorithm + UI
- [x] Finds slots where all (or most) members are free
- [x] Merges consecutive slots into blocks
- [x] Ranks by: member count, duration, time preference
- [x] Shows top 5 suggestions as cards
- [x] Each card: day, time range, duration, who's available
- [x] "Schedule This" button (owner only)
- [x] Handles no-overlap edge case with partial matches

### Task Management
- [x] `components/project/TasksTab.tsx` - board/list toggle, add task, AI suggest buttons
- [x] `components/project/TaskBoard.tsx` - 3-column Kanban with dnd-kit
- [x] Drag-and-drop between columns updates task status
- [x] `components/project/TaskCard.tsx` - title, assignee, due date, drag handle
- [x] `components/project/TaskDetailModal.tsx` - full task editor
- [x] Task detail: edit title, description, assignee, due date, status
- [x] Task detail: delete with confirmation
- [x] `components/project/TaskListView.tsx` - grouped list, mobile-friendly
- [x] `components/project/AddTaskModal.tsx` - quick-add form
- [x] Task CRUD all saves to Supabase

### AI Task Suggestions
- [x] `lib/gemini.ts` - Gemini client configuration
- [x] `app/api/suggest-tasks/route.ts` - API endpoint calling Gemini
- [x] `components/project/AISuggestButton.tsx` - trigger button with loading state
- [x] `components/project/TaskSuggestionsModal.tsx` - display and add suggestions
- [x] Suggestions show title, description, hours, priority
- [x] "Add" per task and "Add All" bulk button
- [x] Graceful fallback when GEMINI_API_KEY is missing
- [x] No app crash on API errors
---

## Next Phase

When all items are checked, proceed to [Phase 5: Team Agreement](phase-5-team-agreement.md).

