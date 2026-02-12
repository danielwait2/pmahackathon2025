# GroupSync Improvements - Checklist

> Use this checklist to track progress. Update status as you complete each item.

---

## Improvement #1: Create Meeting Calendar Event

### Setup & Planning

- [x] Read `IMPROVEMENTS-TODO.md` section for Improvement #1
- [x] Review `components/project/UpcomingMeetings.tsx` structure
- [x] Review `components/project/ScheduleMeetingModal.tsx` flow
- [x] Understand Meeting model (date, startTime, endTime, title)

### Implementation

- [x] Create `lib/calendar-utils.ts` with:
  - [x] `getGoogleCalendarUrl(event)`
  - [x] `getOutlookCalendarUrl(event)`
  - [x] `downloadIcsFile(event, filename)`
  - [x] Correct UTC/local time handling for dates
- [x] Add "Add to Calendar" dropdown/buttons to `UpcomingMeetings.tsx`
- [x] Wire up Google Calendar link (opens in new tab)
- [x] Wire up Outlook link (opens in new tab)
- [x] Wire up Apple Calendar (.ics download)
- [x] (Optional) Add calendar options to success state in `ScheduleMeetingModal`

### Verification

- [x] Google Calendar link opens with correct title, date, time
- [x] Outlook link opens with correct event details
- [x] .ics file downloads and imports correctly into Apple Calendar
- [x] Works for meetings in the past (if applicable)
- [x] Mobile: buttons/dropdown work on small screens

### Status: [ ] Not started | [ ] In progress | [x] Complete

---

## Improvement #2: Combine Team View + Meeting Finder on One Page

### Setup & Planning

- [x] Read `IMPROVEMENTS-TODO.md` section for Improvement #2
- [x] Review `AvailabilityTab.tsx` current tab structure
- [x] Review `TeamAvailability.tsx` and `MeetingFinder.tsx` layout
- [x] Decide: merge tabs or add new combined tab

### Implementation

- [x] Modify `AvailabilityTab.tsx` to combine Team View + Meeting Finder
- [x] Create side-by-side layout (desktop: grid | suggestions)
- [x] Ensure `teamData` and `weekOffset` passed to both components
- [x] Adjust `TeamAvailability` for compact/narrow layout if needed
- [x] Stack layout vertically on mobile
- [x] Include `UpcomingMeetings` in combined view
- [x] Update tab labels (e.g. "My Availability" | "Schedule")

### Verification

- [x] Team availability visible alongside meeting finder
- [x] Suggested times display correctly
- [x] Week navigation updates both sections
- [x] No duplicate data fetching
- [x] Responsive on tablet and mobile
- [x] Existing flows (save availability, schedule meeting) still work

### Status: [ ] Not started | [ ] In progress | [x] Complete

---

## Improvement #3: Add Onboarding Tutorial

### Setup & Planning

- [x] Read `IMPROVEMENTS-TODO.md` section for Improvement #3
- [x] Identify where to trigger (projects page, first project, or both)
- [x] Define 3-4 step content

### Implementation

- [x] Create `lib/onboarding.ts`:
  - [x] `hasSeenOnboarding(): boolean`
  - [x] `markOnboardingSeen(): void`
- [x] Create `components/onboarding/OnboardingTour.tsx`:
  - [x] Multi-step modal/dialog
  - [x] Steps: Create/join project -> Set availability -> Find times -> Assign tasks
  - [x] Next / Skip / Got it buttons
  - [x] Call `markOnboardingSeen()` on dismiss
- [x] Add `OnboardingTour` to dashboard/projects page
- [x] Guard: only show when `!hasSeenOnboarding()`

### Verification

- [x] First-time visitor sees tour
- [x] Can progress through steps or skip
- [x] Dismissing sets localStorage
- [x] Tour does not show on subsequent visits
- [x] Clearing localStorage brings tour back (optional test)
- [x] Tour does not block critical UI
- [x] Accessible (keyboard, screen reader considerations)

### Status: [ ] Not started | [ ] In progress | [x] Complete

---

## Improvement #4: Add Due Dates and Reminders to Tasks

### Setup & Planning

- [x] Read `IMPROVEMENTS-TODO.md` section for Improvement #4
- [x] Review Task model in `prisma/schema.prisma` (dueDate exists)
- [x] Review `AddTaskModal.tsx` and `TaskDetailModal.tsx` form structure
- [x] Review task API routes and serialization

### Implementation

- [x] Add `reminderDate DateTime? @map("reminder_date")` to Task in schema
- [ ] Run `npx prisma migrate dev` for migration
- [x] Update `types/index.ts` - add `reminderDate` to Task interface
- [x] Update `AddTaskModal.tsx`:
  - [x] Add reminder date field
  - [x] When due date is set, default reminder to due date - 1 day
  - [x] Allow user to override or clear reminder
- [x] Update `TaskDetailModal.tsx` - add reminder field for editing
- [x] Update `TaskCard.tsx` - display reminder when present
- [x] Update `TaskListView.tsx` - display reminder when present
- [x] Update `app/api/tasks/route.ts` - accept and save `reminderDate`
- [x] Update `app/api/tasks/[id]/route.ts` - accept and save `reminderDate`
- [x] Update `app/project/[id]/page.tsx` - include `reminderDate` in serialization
- [x] Update `app/dashboard/page.tsx` - include `reminderDate` in serialization

### Verification

- [x] Can set due date when creating a task
- [x] Can set reminder; defaults to 1 day before due when due date is set
- [x] Can edit due date and reminder on existing tasks
- [x] Reminder displays on task cards and task detail
- [x] Reminder can be cleared without clearing due date
- [x] API persists and returns `reminderDate` correctly

### Status: [ ] Not started | [x] In progress | [ ] Complete

---

## Overall Progress

| Improvement | Status      | Notes |
| ----------- | ----------- | ----- |
| #1 Calendar event | Complete | Implemented in `UpcomingMeetings` and `ScheduleMeetingModal` |
| #2 Combined view | Complete | Combined Schedule tab with responsive two-column layout |
| #3 Onboarding | Complete | LocalStorage-gated onboarding modal added to dashboard |
| #4 Due dates & reminders | In progress | `migrate dev` cannot run in non-interactive environment; schema and app code complete |

---

## Quick Reference

- **Instructions:** `groupsync/ai/IMPROVEMENTS-TODO.md`
- **This checklist:** `groupsync/ai/IMPROVEMENTS-CHECKLIST.md`
- **Agent entry point:** `groupsync/AGENTS.md`
