# GroupSync - Next Feature Improvements

> Additional improvements to enhance scheduling flexibility and task management.

---

## Priority Rankings

| Rank | Improvement | Usefulness | Ease | Score | Status |
|------|------------|-----------|------|-------|--------|
| 1 | Week navigation for availability (next/previous week) | 9/10 | 7/10 | **Highest** | ❌ Not done |
| 2 | 30-minute meeting duration option | 8/10 | 8/10 | **High** | ❌ Not done |
| 3 | Edit tasks after creation | 7/10 | 6/10 | **Medium** | ❌ Not done |
| 4 | View all assigned tasks from projects page | 8/10 | 7/10 | **High** | ❌ Not done |

**Total estimated time:** ~4-5 hours

---

## Improvement #1: Week Navigation for Availability

**Problem:** Users can only set availability for the current week. If they want to plan ahead or schedule meetings more than a week out, they can't enter their availability in advance.

**Value:** Enables advance planning, better for teams that schedule meetings weeks ahead, makes the tool more flexible for different planning horizons.

### What to Build

1. **Week Navigation UI:**
   - Add previous/next week arrows to availability grid header
   - Display current week range: "Week of Feb 10-16, 2026"
   - "Today" button to jump back to current week
   - Visual indicator when viewing a future/past week

2. **State Management:**
   - Track selected week offset (0 = current week, +1 = next week, -1 = previous week)
   - Recalculate dates when week changes
   - Persist availability data for multiple weeks

3. **Data Layer:**
   - Update availability save/load to include week/date context
   - Ensure availability records are date-specific (already have date field)
   - Load availability for the selected week

### Files to Modify

- `components/project/AvailabilityGrid.tsx` — add week navigation controls, track week offset state
- `components/project/TeamAvailability.tsx` — same navigation controls for team view
- `components/project/AvailabilityTab.tsx` — pass week state to child components
- `components/project/availability-utils.ts` — add `getWeekDates(offset: number)` helper
- `components/project/MeetingFinder.tsx` — respect selected week when finding meetings

### Implementation Steps

1. Add week offset state to AvailabilityTab (useState hook)
2. Create navigation controls component with < > arrows and week label
3. Update date calculation to use offset: `getWeekDates(weekOffset)`
4. Update availability load/save to filter by selected week dates
5. Add visual indicator when not viewing current week
6. Test: set availability for next week, switch back to current week, verify data persists

### Verification

- [ ] Navigation arrows appear in header
- [ ] Week label shows correct date range
- [ ] Clicking next week shows next Monday-Sunday
- [ ] Availability can be set for future weeks
- [ ] Switching weeks preserves previously saved availability
- [ ] Team view shows availability for selected week
- [ ] Meeting finder uses selected week for suggestions
- [ ] "Today" button returns to current week
- [ ] Mobile layout still works with navigation

### Effort Estimate
~1.5-2 hours

---

## Improvement #2: 30-Minute Meeting Duration Option

**Problem:** Meeting scheduler only supports 1-hour meetings. Some teams need shorter 30-minute check-ins or longer 1.5-2 hour meetings.

**Value:** Flexibility for different meeting types, more accurate scheduling, better matches real-world meeting needs.

### What to Build

1. **Duration Selector:**
   - Add duration dropdown/radio buttons to MeetingFinder
   - Options: 30 min, 1 hour (default), 1.5 hours, 2 hours
   - Duration affects time slot calculations

2. **Update Meeting Finder Logic:**
   - Use selected duration when calculating available slots
   - Show duration in each suggestion: "2:00 PM - 2:30 PM (30 min)"
   - Filter availability blocks based on duration

3. **Update Schedule Modal:**
   - Pre-fill duration from suggestion
   - Allow editing duration when scheduling
   - Calculate endTime based on startTime + duration

### Files to Modify

- `components/project/MeetingFinder.tsx` — add duration selector, update slot calculation
- `components/project/ScheduleMeetingModal.tsx` — add duration field, calculate endTime
- `components/project/UpcomingMeetings.tsx` — display meeting duration in list

### Implementation Steps

1. Add duration state to MeetingFinder (default: 60)
2. Create duration selector UI (radio buttons or select)
3. Update `findCommonAvailability()` to accept duration parameter
4. Modify time slot generation to use dynamic duration
5. Update modal to include duration field
6. Display duration badge on scheduled meetings

### Verification

- [ ] Duration selector appears in Meeting Finder
- [ ] Can select 30 min, 1 hr, 1.5 hr, 2 hr
- [ ] Suggested times reflect selected duration
- [ ] Scheduling modal pre-fills correct duration
- [ ] Can edit duration before confirming meeting
- [ ] Scheduled meetings display duration correctly
- [ ] Shorter durations find more available slots
- [ ] Longer durations filter appropriately

### Effort Estimate
~1-1.5 hours

---

## Improvement #3: Edit Tasks After Creation

**Problem:** Once a task is created, it can't be edited. If there's a typo, wrong assignee, or change in requirements, users have to delete and recreate the task.

**Value:** Reduces frustration, enables iterative refinement, better matches real-world task management workflows.

### What to Build

1. **Edit UI:**
   - Add "Edit" button/icon next to each task
   - Click opens modal/inline form with current task details
   - Editable fields: title, description, assignee, due date, status
   - Save/Cancel buttons

2. **API Route:**
   - `PATCH /api/tasks/[id]` — update task fields
   - Validate user has permission (project member)
   - Update `updatedAt` timestamp

3. **Permissions:**
   - Task creator can always edit
   - Project owner can edit any task
   - Assignee can edit their own tasks
   - Other members can't edit (or make configurable)

### Files to Create

- `components/project/EditTaskModal.tsx` — reusable task edit form

### Files to Modify

- `app/api/tasks/[id]/route.ts` — add PATCH handler (may need to create file)
- `components/project/TasksTab.tsx` — add edit button to each task
- `prisma/schema.prisma` — ensure Task model has `updatedAt` field

### Implementation Steps

1. Create EditTaskModal component (similar structure to CreateTaskModal)
2. Add PATCH route to update task in database
3. Add edit icon/button to task list items
4. Wire up edit button to open modal with current task data
5. Handle form submission and optimistic UI update
6. Add permission checks in API route
7. Display "Last edited" timestamp if recently modified

### Verification

- [ ] Edit button appears on each task
- [ ] Clicking opens modal with pre-filled current values
- [ ] Can modify title, description, assignee, due date
- [ ] Saving updates the task immediately
- [ ] Changes visible to other team members
- [ ] Canceling discards changes
- [ ] Permission rules enforced (test with different users)
- [ ] Updated timestamp shows when task was edited
- [ ] Validation prevents empty titles

### Effort Estimate
~1.5 hours

---

## Improvement #4: View All Assigned Tasks from Projects Page

**Problem:** Users have to navigate into each project to see what tasks are assigned to them. No centralized view of "My Tasks" across all projects.

**Value:** Single place to see all your work, easier prioritization, faster task review, better personal productivity.

### What to Build

1. **My Tasks Section on Dashboard:**
   - Add "My Tasks" panel to projects list page
   - Shows all tasks assigned to current user across all their projects
   - Group by project or sort by due date
   - Click task → navigate to that project's tasks tab

2. **API Route:**
   - `GET /api/tasks/my-tasks` — fetch tasks for current user
   - Includes project name/id for context
   - Filter by status (optional: show only open tasks)

3. **UI Features:**
   - Task title, project name, due date, status
   - Visual priority indicators
   - Empty state: "No tasks assigned yet"
   - Optional filters: all tasks vs. only incomplete
   - Count badge: "You have 5 tasks"

### Files to Create

- `components/dashboard/MyTasksPanel.tsx` — new component for projects page
- `app/api/tasks/my-tasks/route.ts` — new API route

### Files to Modify

- `app/projects/page.tsx` — add MyTasksPanel to dashboard
- May need to adjust layout/styling for new section

### Implementation Steps

1. Create API route to fetch user's tasks with project context
2. Create MyTasksPanel component with task list UI
3. Add to projects/dashboard page (above or beside project list)
4. Implement task click handler → navigate to project
5. Add status filter toggle (show completed or not)
6. Style with card/panel design matching existing UI
7. Add loading state and empty state

### Verification

- [ ] "My Tasks" panel appears on projects page
- [ ] Shows tasks assigned to current user only
- [ ] Displays task title, project name, due date
- [ ] Tasks from multiple projects appear together
- [ ] Clicking task navigates to correct project
- [ ] Count badge shows accurate number
- [ ] Empty state when no tasks assigned
- [ ] Updates when tasks are created/edited/deleted
- [ ] Filters work (completed vs. incomplete)
- [ ] Mobile layout doesn't break

### Effort Estimate
~1-1.5 hours

---

## Implementation Order

**Recommended sequence:**

1. **#2 first** (30-min meetings) — quickest, high value, enhances recently-built feature
2. **#1 second** (week navigation) — highest priority, enables advance planning
3. **#4 third** (view all tasks) — high value, standalone feature
4. **#3 last** (edit tasks) — nice-to-have, completes task management suite

**Total time:** ~4-5 hours

---

## Combined Features Impact

After implementing these improvements:

✅ **Scheduling becomes more flexible:**
- Plan availability weeks in advance
- Schedule both quick check-ins (30 min) and long working sessions (2 hours)

✅ **Task management becomes complete:**
- Edit tasks when requirements change
- See all your work in one place across projects

✅ **User workflow improvements:**
- Less context switching (see tasks from dashboard)
- Better planning horizon (multi-week availability)
- Matches real-world meeting types (variable durations)

---

## Technical Notes

### Week Navigation Implementation Detail

Use ISO week calculation to ensure consistent week boundaries:

```typescript
function getWeekDates(offset: number = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Monday
  const monday = new Date(today.setDate(diff));
  monday.setDate(monday.getDate() + (offset * 7)); // Apply week offset

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}
```

### Meeting Duration Data Model

Current Meeting model uses `startTime` and `endTime` strings. Duration can be calculated from these. No schema change needed unless you want to store duration explicitly.

### Task Editing Permissions

Suggested permission matrix:

| User Role | Can Edit? |
|-----------|-----------|
| Task creator | ✅ Always |
| Task assignee | ✅ Always |
| Project owner | ✅ Always |
| Other team members | ❌ No (or make configurable) |

### My Tasks API Performance

For users with many projects, add pagination or limit to recent tasks:

```typescript
// Limit to tasks from last 30 days or next 30 days
const tasks = await prisma.task.findMany({
  where: {
    assigneeId: userId,
    OR: [
      { dueDate: { gte: thirtyDaysAgo } },
      { dueDate: { lte: thirtyDaysFromNow } },
      { dueDate: null } // Include tasks without due date
    ]
  },
  include: { project: { select: { id: true, name: true } } },
  orderBy: { dueDate: 'asc' }
});
```

---

## Out of Scope (for this iteration)

- Recurring meetings (weekly/daily patterns)
- Task templates or checklists
- Calendar sync (Google/Outlook integration)
- Notifications for upcoming tasks/meetings
- Task dependencies or subtasks
- Time tracking on tasks
