# GroupSync – Agent Improvements Instructions

> **For AI agents:** This document describes improvements to implement. Read this file and `IMPROVEMENTS-CHECKLIST.md` before starting work. Check off items in the checklist as you complete them.

---

## Summary of Improvements

| #   | Feature                                              | Priority      | Effort | Status         |
| --- | ---------------------------------------------------- | ------------- | ------ | -------------- |
| 1   | Create meeting calendar event (Google/Apple/Outlook) | **Must-have** | Medium | ⬜ Not started |
| 2   | Combine Team View + Meeting Finder on one page       | High          | Medium | ⬜ Not started |
| 3   | Add onboarding tutorial for first-time users         | Medium        | Low    | ⬜ Not started |
| 4   | Add due dates and reminders to tasks                 | High          | Medium | ⬜ Not started |

---

## Improvement #1: Create Meeting Calendar Event

### Context from user feedback

Users repeatedly said:

- "I was surprised I couldn't schedule a meeting from the team calendar page"
- "If I could add a meeting right from the team availability page I'd love it"
- "If I have to go use outlook's calendar anyway to set up my meeting then I must just choose to do it all in there"
- "Integration to Google Calendar"
- "A way to add meetings to your calendar"
- "Could be cool if you could somehow make calendar events from it"
- "I wish the meeting finder would allow me to select a meeting time and send it through the group (maybe even automatically make a google meet link)"

### What to build

After a user schedules a meeting in GroupSync, add **"Add to Calendar"** actions so they can add the event to:

1. **Google Calendar** – web link
2. **Outlook / Office 365** – web link
3. **Apple Calendar** – downloadable .ics file

### Technical implementation

**Option A (recommended – no backend):**  
After a meeting is created and shown in `UpcomingMeetings` or in a success state, add a dropdown or button group:

- **Add to Google Calendar** → open `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}_Z/{end}_Z&details={description}`
- **Add to Outlook** → open `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&startdt={ISO}&enddt={ISO}&subject={title}&body={description}`
- **Add to Apple Calendar** → trigger download of a generated `.ics` file (client-side blob with `application/ics` MIME type)

**Date format notes:**

- Google: `YYYYMMDDTHHmmssZ` (UTC) for `dates` = `{start}_Z/{end}_Z`
- Outlook: `YYYY-MM-DDTHH:mm:ss` (can use local time)
- .ics: `YYYYMMDDTHHmmssZ` (UTC), format: `DTSTART:20260211T140000Z`

**Files to modify:**

- `components/project/UpcomingMeetings.tsx` – add "Add to Calendar" button/dropdown per meeting
- `components/project/ScheduleMeetingModal.tsx` – optionally show "Add to Calendar" options in success state before closing
- New: `lib/calendar-utils.ts` – helpers: `getGoogleCalendarUrl()`, `getOutlookCalendarUrl()`, `generateIcsBlob()`

### Calendar utility API

```typescript
// lib/calendar-utils.ts
interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date; // or { date: string, time: string } from meeting
  end: Date;
}

export function getGoogleCalendarUrl(event: CalendarEvent): string;
export function getOutlookCalendarUrl(event: CalendarEvent): string;
export function downloadIcsFile(event: CalendarEvent, filename?: string): void;
```

### Verification

- [ ] After scheduling a meeting, user can add it to Google Calendar
- [ ] After scheduling a meeting, user can add it to Outlook
- [ ] After scheduling a meeting, user can download .ics for Apple Calendar
- [ ] Links open in new tab; .ics triggers download
- [ ] Date/time in links matches meeting start/end
- [ ] Works from both `ScheduleMeetingModal` success state and `UpcomingMeetings` list

---

## Improvement #2: Combine Team View + Meeting Finder on One Page

### Context from user feedback

Users said:

- "The two pages team calendar and team meeting finder would have made more sense on one page so I can see the calendar when I'm looking at the suggested times"
- "Trello board and availability in one place"
- "The two services seemed very separate and not integrated"
- "Integration to Google Calendar" + "make the meeting coordination for specific board items"

### What to build

Instead of separate tabs for "Team View" and "Meeting Finder", show both on a single view so users see:

- Team availability grid on the left
- Suggested meeting times and scheduling on the right

### Implementation approach

1. **Change tab structure** in `AvailabilityTab.tsx`:
   - Option A: Replace "Meeting Finder" tab with a combined "Schedule" tab that shows `TeamAvailability` + `MeetingFinder` + `UpcomingMeetings` in one layout
   - Option B: Add a new "Schedule" tab that combines both; or merge "Team View" and "Meeting Finder" into one tab
2. **Layout:** Side-by-side on desktop (grid | suggestions), stacked on mobile
3. **Shared state:** Both components already use `teamData` and `weekOffset`; pass the same props
4. **URL/state:** Keep week navigation shared across the combined view

### Files to modify

- `components/project/AvailabilityTab.tsx` – merge Team View and Meeting Finder into one tab
- `components/project/TeamAvailability.tsx` – ensure it fits in a narrower column (e.g. compact header)
- `components/project/MeetingFinder.tsx` – no structural changes; may need small layout tweaks
- Optionally: rename tabs (e.g. "My Availability" | "Schedule" instead of "My Availability" | "Team View" | "Meeting Finder")

### Verification

- [ ] User sees team availability and meeting finder on the same screen
- [ ] Suggested times appear alongside the calendar
- [ ] Week navigation applies to both
- [ ] Layout works on mobile (stacked)
- [ ] Upcoming meetings still visible in the combined view

---

## Improvement #3: Add Onboarding Tutorial for First-Time Users

### Context from user feedback

- "Just not knowing what to do right off the bat, could be nice to have some sort of tutorial"
- "Understanding where to go a little bit the navigation I think could be improved"

### What to build

A lightweight first-time onboarding that:

1. Shows a short tour when a user first lands on the projects page or first project
2. Highlights: "Create a project" or "Set your availability" → "Find meeting times" → "Manage tasks"
3. Can be dismissed and not shown again (e.g. via `localStorage`)
4. Does not block critical flows

### Implementation approach

1. **Storage:** `localStorage.setItem('groupsync-onboarding-seen', 'true')` when dismissed
2. **UI:** Simple modal or step-by-step overlay with "Next" / "Skip" / "Got it"
3. **Triggers:** Show on first visit to `/projects` or first project page
4. **Content:** 3–4 steps: "Create or join a project" → "Set your availability" → "Find times that work for everyone" → "Assign tasks to your team"
5. **Libraries:** No need for a heavy tour library; a simple Dialog + step state is enough

### Files to create

- `components/onboarding/OnboardingTour.tsx` – modal, steps, dismiss logic
- `lib/onboarding.ts` – `hasSeenOnboarding()`, `markOnboardingSeen()`

### Files to modify

- `app/projects/page.tsx` or `components/dashboard/DashboardShell.tsx` – render `OnboardingTour` when appropriate
- Optionally: `app/projects/[id]/page.tsx` – show tour on first project visit

### Verification

- [ ] First-time user sees onboarding
- [ ] User can advance through steps or skip
- [ ] Dismissing sets `localStorage` and tour does not show again
- [ ] Returning user does not see tour
- [ ] Tour does not interfere with core flows

---

## Improvement #4: Add Due Dates and Reminders to Tasks

### Context

Tasks need due dates and reminders so users can track deadlines and get notified before work is due. The app already has `dueDate` on the Task model; this improvement adds reminder support and ensures both are fully supported in the UI.

### What to build

1. **Due dates** – Ensure tasks can have due dates set (schema exists; verify UI supports creation/editing everywhere)
2. **Reminder dates** – Add the ability to set a reminder for each task
3. **Default reminder** – When a due date is set, default the reminder to 1 day before the due date
4. **Custom reminders** – Allow users to change the reminder (e.g. 1 hour before, 1 week before, or a specific date/time)

### Technical implementation

**Schema change (Prisma):**

- Add `reminderDate DateTime? @map("reminder_date")` to the Task model
- Run migration

**UI:**

- Add reminder date picker to `AddTaskModal` and `TaskDetailModal` (when editing)
- When user selects a due date, auto-populate reminder as due date − 1 day (user can override)
- Display reminder in `TaskCard`, `TaskListView`, and `TaskDetailModal`
- Optionally: show "Reminder: [date]" or "Reminds [X time] before due"

**API:**

- Update `POST /api/tasks` and `PATCH /api/tasks/[id]` to accept `reminderDate`
- Return `reminderDate` in task responses

**Future (optional):** Actual notification delivery (email, push, in-app) would require a backend job/cron. For now, storing and displaying the reminder is sufficient; notification delivery can be a follow-up.

### Files to modify

- `prisma/schema.prisma` – add `reminderDate` to Task
- `types/index.ts` – add `reminderDate` to Task interface
- `components/project/AddTaskModal.tsx` – add reminder field, default to due − 1 day
- `components/project/TaskDetailModal.tsx` – add reminder field when editing
- `components/project/TaskCard.tsx` – display reminder when present
- `components/project/TaskListView.tsx` – display reminder when present
- `app/api/tasks/route.ts` – accept and save `reminderDate`
- `app/api/tasks/[id]/route.ts` – accept and save `reminderDate` on update
- `app/project/[id]/page.tsx` – include `reminderDate` in task serialization
- `app/dashboard/page.tsx` – include `reminderDate` in task serialization

### Verification

- [ ] User can set a due date when creating a task
- [ ] User can set a reminder when creating a task; if due date is set, reminder defaults to 1 day before
- [ ] User can edit due date and reminder on existing tasks
- [ ] Reminder displays on task cards and in task detail
- [ ] Reminder can be cleared independently of due date
- [ ] API persists and returns `reminderDate` correctly

---

## Feedback Analysis (Reference)

### Themes from user feedback

| Theme                             | Mentioned by | Ease     | Notes                                        |
| --------------------------------- | ------------ | -------- | -------------------------------------------- |
| Add meeting to calendar           | 6+           | Medium   | Primary request                              |
| Combine calendar + meeting finder | 4+           | Medium   | High impact                                  |
| Tutorial/onboarding               | 2+           | Low      | Quick win                                    |
| Make account creation optional    | 2            | High     | Guest join flow                              |
| Notifications/reminders           | 4+           | High     | Backend + push                               |
| Dates on schedule                 | 1            | Very low | May already exist via `getDayHeaderWithDate` |
| Meeting duration selector         | 3+           | Done     | Already implemented                          |
| Mobile accessibility              | 2            | Medium   | Responsive work                              |
| Web hosted/deploy                 | 1            | Varies   | DevOps                                       |

### Why these 4 improvements?

1. **Calendar event creation** – direct, frequent request; keeps users in one place instead of switching to Outlook/Google
2. **Combine Team View + Meeting Finder** – improves flow and reduces context switching
3. **Onboarding tutorial** – low effort, addresses confusion about where to start
4. **Due dates and reminders** – requested feature; default reminder (1 day before due) improves task follow-through

---

## Implementation Order

1. **Improvement #1** (Add to Calendar) – core user request
2. **Improvement #2** (Combine views) – high impact UX change
3. **Improvement #3** (Onboarding) – quick win, can be done in parallel
4. **Improvement #4** (Due dates and reminders) – high value for task management

---

## Related Files

- Existing improvements doc: `/ai/next-improvements.md` (project root)
- Checklist: `groupsync/ai/IMPROVEMENTS-CHECKLIST.md`
- Main components: `groupsync/components/project/`
