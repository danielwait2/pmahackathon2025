# Phase 6: Polish & Demo Prep

> **Time Estimate:** 2 hours
> **Priority:** SHOULD
> **Prerequisites:** Phases 0-4 complete (Phase 5 recommended)
> **Rubric:** Design & UX (polished experience)

---

## Goal

Add empty states, loading states, error handling, mobile optimization, and create demo seed data for a smooth presentation.

---

## Steps

### 6.1 Empty States

Create helpful, encouraging empty states for every section that could be empty:

| Location | When Empty | Message | CTA |
|---|---|---|---|
| Dashboard | No projects | "No projects yet. Create your first project or join one with an invite code." | "Create Project" + "Join Project" buttons |
| Task board | No tasks | "No tasks yet. Add your first task or let AI suggest some." | "Add Task" + "Suggest with AI" buttons |
| Availability (own) | Not submitted | "Add your availability so your team can find meeting times." | Grid ready to fill in |
| Availability (team) | No one submitted | "No one has submitted availability yet. You can be the first!" | Link to own input |
| Team Agreement | Not created | Owner: "Set expectations for your team" / Member: "Waiting for your team lead to set expectations" | Owner: "Create Agreement" button |
| Meeting Finder | No overlap | "No times where everyone is free. Showing best partial matches." | Show partial results |

Design:
- Use Lucide icons at large size (48-64px) as illustration
- Muted text color for description
- Prominent CTA button(s)
- Center-aligned in the content area

### 6.2 Loading States

Add skeleton loaders and spinners to prevent layout shift:

| Component | Loading Pattern |
|---|---|
| Dashboard project list | Skeleton cards (3 placeholder cards with pulsing animation) |
| Project page | Skeleton for header + tab content |
| Availability grid | Grid with pulsing cells |
| Task board | Skeleton columns with placeholder cards |
| AI suggestions | Spinner + "Generating suggestions..." text |
| Any form submission | Button shows spinner, text changes to "Saving..." |

Use shadcn `Skeleton` component for consistent loading patterns.

**Optimistic updates for snappy feel:**
- Task drag-and-drop: update UI immediately, sync to Supabase in background
- "I Agree" button: show checkmark immediately, sync in background
- Task status checkbox: toggle immediately, sync in background
- If sync fails: revert UI and show error toast

### 6.3 Toast Notifications

Add toast feedback for all key actions using shadcn `toast`:

| Action | Toast Message | Type |
|---|---|---|
| Project created | "Project created! Share the invite code with your team." | success |
| Invite link copied | "Invite link copied to clipboard!" | success |
| Joined project | "Welcome to {project name}!" | success |
| Availability saved | "Availability saved!" | success |
| Task added | "Task added!" | success |
| Task updated | "Task updated." | success |
| Task deleted | "Task deleted." | info |
| AI tasks added | "Added {N} tasks to your board." | success |
| Agreement created | "Team agreement created!" | success |
| Agreement updated | "Agreement updated. Team needs to re-agree." | info |
| Agreed to agreement | "Thanks! You've agreed to the team expectations." | success |
| Network error | "Something went wrong. Please try again." | error |
| Invalid invite code | "Invalid invite code. Check with your team." | error |

### 6.4 Error Handling

**Network errors:**
- Wrap Supabase calls in try/catch
- Show toast with generic message
- Log detailed error to console (for debugging)
- Don't crash the page — show error state inline

**Form validation:**
- Inline error messages under inputs (red text)
- Disable submit button until form is valid
- Required field indicators (asterisk or "Required" label)

**404 / Not Found:**
- Invalid project ID → "This project doesn't exist or you don't have access."
- Invalid invite code → "This invite code doesn't exist."
- Show a link back to dashboard

**Auth errors:**
- Session expired → redirect to login with toast "Session expired. Please log in again."

### 6.5 Mobile Optimization Pass

Test everything at 375px width (iPhone SE) and fix issues:

**Navigation:**
- Dashboard header: collapse to icon-only or hamburger on mobile
- Project tabs: horizontal scroll (swipeable) or use a dropdown select

**Availability grid:**
- Switch to list-based input on screens < 768px
- List view: day name → add time range → start/end dropdowns

**Task board:**
- Switch to list view by default on mobile (< 768px)
- Or stack columns vertically with collapsible sections
- Ensure drag handles have large touch targets (44px min)

**Modals:**
- On mobile: make modals full-screen (bottom sheet pattern)
- Ensure inputs aren't covered by keyboard on iOS

**Typography:**
- Minimum 16px for body text (prevents iOS auto-zoom on focus)
- Tap targets: minimum 44x44px

**Common mobile issues to check:**
- No horizontal scroll on any page
- Buttons not cut off at screen edges
- Text not overflowing containers
- Forms usable with mobile keyboard

### 6.6 Demo Seed Data

**`scripts/seed-demo.ts`** — Script to populate demo data

Create a script that can be run to set up a realistic demo state:

```typescript
// Demo data to create:

const demoProject = {
  name: "CS 401 Final Project — Research Paper",
  description: "Group research paper on machine learning applications in healthcare. 15 pages, APA format, due end of semester.",
  deadline: "2025-04-15", // Adjust to ~2 weeks from hackathon date
};

const demoMembers = [
  { name: "Alex Chen", role: "owner" },
  { name: "Jordan Kim", role: "member" },
  { name: "Sam Patel", role: "member" },
  { name: "Taylor Rodriguez", role: "member" },
];

const demoTasks = [
  { title: "Research ML healthcare papers", status: "done", assigned_to: "Alex Chen" },
  { title: "Write literature review section", status: "done", assigned_to: "Jordan Kim" },
  { title: "Collect dataset examples", status: "in_progress", assigned_to: "Sam Patel" },
  { title: "Draft methodology section", status: "in_progress", assigned_to: "Alex Chen" },
  { title: "Create data visualizations", status: "todo", assigned_to: "Taylor Rodriguez" },
  { title: "Write results and analysis", status: "todo", assigned_to: null },
  { title: "Peer review all sections", status: "todo", assigned_to: null },
  { title: "Final formatting and submission", status: "todo", assigned_to: null },
];

const demoAvailability = {
  "Alex Chen": [
    { day: 1, start: "09:00", end: "12:00" },
    { day: 1, start: "14:00", end: "17:00" },
    { day: 3, start: "10:00", end: "15:00" },
    { day: 5, start: "09:00", end: "13:00" },
  ],
  "Jordan Kim": [
    { day: 1, start: "11:00", end: "16:00" },
    { day: 2, start: "13:00", end: "18:00" },
    { day: 3, start: "11:00", end: "16:00" },
    { day: 4, start: "13:00", end: "18:00" },
  ],
  "Sam Patel": [
    { day: 1, start: "10:00", end: "14:00" },
    { day: 2, start: "10:00", end: "14:00" },
    { day: 3, start: "10:00", end: "14:00" },
    { day: 5, start: "10:00", end: "16:00" },
  ],
  "Taylor Rodriguez": [
    { day: 2, start: "09:00", end: "12:00" },
    { day: 3, start: "09:00", end: "13:00" },
    { day: 4, start: "14:00", end: "20:00" },
    { day: 5, start: "10:00", end: "15:00" },
  ],
};

const demoAgreement = {
  response_time_hours: 24,
  meeting_frequency: "Twice a week",
  communication_channel: "Discord",
  quality_standards: "Review each other's sections before merging. Cite all sources in APA format. Proofread for grammar and clarity.",
  agreed_by: ["Alex Chen", "Jordan Kim", "Sam Patel"], // Taylor hasn't agreed yet
};
```

**Note:** This script needs real Supabase user IDs. Options:
1. Create test accounts first, then use their IDs
2. Make the script create accounts via Supabase admin API
3. Manually insert via Supabase dashboard SQL editor

### 6.7 End-to-End Flow Test

Run through the complete demo flow manually:

1. Land on landing page → check all sections render
2. Click "Get Started Free" → sign up with test account
3. Arrive at dashboard → see empty state
4. Create a project via wizard → fill all 3 steps
5. Copy invite link
6. Open in incognito/different browser → sign up as second user
7. Paste invite link → join project
8. Back as first user: fill availability grid → save
9. Switch to second user: fill different availability → save
10. Check team availability overlap → colors appear
11. Click "Find Meeting Times" → suggestions shown
12. Add tasks manually
13. Try AI suggestions (if Gemini key configured)
14. Drag task between columns
15. Go to Team tab → view agreement
16. Second user clicks "I Agree"
17. Check mobile on real phone (or responsive mode)

---

## Checklist

### Empty States
- [ ] Dashboard empty state (no projects)
- [ ] Task board empty state (no tasks)
- [ ] Availability empty state (not submitted)
- [ ] Team availability empty state (no one submitted)
- [ ] Team agreement empty state (not created)
- [ ] Meeting finder empty/no-overlap state

### Loading States
- [ ] Dashboard: skeleton project cards
- [ ] Project page: skeleton content
- [ ] Task board: skeleton cards
- [ ] AI suggestions: spinner + text
- [ ] Form buttons show loading state on submit

### Toasts & Feedback
- [ ] Project created toast
- [ ] Invite link copied toast
- [ ] Joined project toast
- [ ] Availability saved toast
- [ ] Task added/updated/deleted toasts
- [ ] AI tasks added toast
- [ ] Agreement created/updated toasts
- [ ] Error toasts for failures

### Error Handling
- [ ] Network errors caught and displayed
- [ ] Form validation with inline errors
- [ ] 404 page for invalid project/invite
- [ ] Auth session expiry handled

### Mobile
- [ ] No horizontal scroll on any page (375px)
- [ ] Navigation usable on mobile
- [ ] Availability input works on mobile (list view)
- [ ] Tasks readable on mobile (list view default)
- [ ] Modals usable on mobile (full-screen)
- [ ] Text minimum 16px, tap targets minimum 44px

### Demo Prep
- [ ] Seed data script written
- [ ] Demo data inserted (or ready to insert)
- [ ] Full end-to-end flow tested
- [ ] No console errors in any flow
- [ ] Demo flow path documented (for presentation)

---

## Next Phase

When all items are checked, proceed to [Phase 7: Deployment](phase-7-deployment.md).
