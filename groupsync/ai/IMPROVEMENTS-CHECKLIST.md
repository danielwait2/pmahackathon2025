# GroupSync Improvements – Checklist

> Use this checklist to track progress. Update status as you complete each item.

---

## Improvement #1: Create Meeting Calendar Event

### Setup & Planning
- [ ] Read `IMPROVEMENTS-TODO.md` section for Improvement #1
- [ ] Review `components/project/UpcomingMeetings.tsx` structure
- [ ] Review `components/project/ScheduleMeetingModal.tsx` flow
- [ ] Understand Meeting model (date, startTime, endTime, title)

### Implementation
- [ ] Create `lib/calendar-utils.ts` with:
  - [ ] `getGoogleCalendarUrl(event)`
  - [ ] `getOutlookCalendarUrl(event)`
  - [ ] `downloadIcsFile(event, filename)`
  - [ ] Correct UTC/local time handling for dates
- [ ] Add "Add to Calendar" dropdown/buttons to `UpcomingMeetings.tsx`
- [ ] Wire up Google Calendar link (opens in new tab)
- [ ] Wire up Outlook link (opens in new tab)
- [ ] Wire up Apple Calendar (.ics download)
- [ ] (Optional) Add calendar options to success state in `ScheduleMeetingModal`

### Verification
- [ ] Google Calendar link opens with correct title, date, time
- [ ] Outlook link opens with correct event details
- [ ] .ics file downloads and imports correctly into Apple Calendar
- [ ] Works for meetings in the past (if applicable)
- [ ] Mobile: buttons/dropdown work on small screens

### Status: [ ] Not started | [ ] In progress | [ ] Complete

---

## Improvement #2: Combine Team View + Meeting Finder on One Page

### Setup & Planning
- [ ] Read `IMPROVEMENTS-TODO.md` section for Improvement #2
- [ ] Review `AvailabilityTab.tsx` current tab structure
- [ ] Review `TeamAvailability.tsx` and `MeetingFinder.tsx` layout
- [ ] Decide: merge tabs or add new combined tab

### Implementation
- [ ] Modify `AvailabilityTab.tsx` to combine Team View + Meeting Finder
- [ ] Create side-by-side layout (desktop: grid | suggestions)
- [ ] Ensure `teamData` and `weekOffset` passed to both components
- [ ] Adjust `TeamAvailability` for compact/narrow layout if needed
- [ ] Stack layout vertically on mobile
- [ ] Include `UpcomingMeetings` in combined view
- [ ] Update tab labels (e.g. "My Availability" | "Schedule")

### Verification
- [ ] Team availability visible alongside meeting finder
- [ ] Suggested times display correctly
- [ ] Week navigation updates both sections
- [ ] No duplicate data fetching
- [ ] Responsive on tablet and mobile
- [ ] Existing flows (save availability, schedule meeting) still work

### Status: [ ] Not started | [ ] In progress | [ ] Complete

---

## Improvement #3: Add Onboarding Tutorial

### Setup & Planning
- [ ] Read `IMPROVEMENTS-TODO.md` section for Improvement #3
- [ ] Identify where to trigger (projects page, first project, or both)
- [ ] Define 3–4 step content

### Implementation
- [ ] Create `lib/onboarding.ts`:
  - [ ] `hasSeenOnboarding(): boolean`
  - [ ] `markOnboardingSeen(): void`
- [ ] Create `components/onboarding/OnboardingTour.tsx`:
  - [ ] Multi-step modal/dialog
  - [ ] Steps: Create/join project → Set availability → Find times → Assign tasks
  - [ ] Next / Skip / Got it buttons
  - [ ] Call `markOnboardingSeen()` on dismiss
- [ ] Add `OnboardingTour` to dashboard/projects page
- [ ] Guard: only show when `!hasSeenOnboarding()`

### Verification
- [ ] First-time visitor sees tour
- [ ] Can progress through steps or skip
- [ ] Dismissing sets localStorage
- [ ] Tour does not show on subsequent visits
- [ ] Clearing localStorage brings tour back (optional test)
- [ ] Tour does not block critical UI
- [ ] Accessible (keyboard, screen reader considerations)

### Status: [ ] Not started | [ ] In progress | [ ] Complete

---

## Overall Progress

| Improvement | Status   | Notes |
|-------------|----------|-------|
| #1 Calendar event | ⬜ | |
| #2 Combined view  | ⬜ | |
| #3 Onboarding     | ⬜ | |

---

## Quick Reference

- **Instructions:** `groupsync/ai/IMPROVEMENTS-TODO.md`
- **This checklist:** `groupsync/ai/IMPROVEMENTS-CHECKLIST.md`
- **Agent entry point:** `groupsync/AGENTS.md`
