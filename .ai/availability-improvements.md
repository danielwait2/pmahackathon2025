# GroupSync – Availability Improvements

> **For AI agents:** This document describes improvements to availability:
> 1. Account-level (general) availability that auto-applies to projects
> 2. Google Calendar import to derive availability from busy times + personal blocks
> 3. Automatic Zoom/Google Meet link creation for meetings
>
> Follow these steps before implementing changes.

---

## Summary

| # | Feature                                            | Priority | Effort | Status   |
|---|----------------------------------------------------|----------|--------|----------|
| 1 | General (account-level) availability               | High     | Medium | ⬜ Not started |
| 2 | Google Calendar import → availability              | High     | High   | ⬜ Not started |
| 3 | Zoom / Google Meet link creation for meetings      | Medium   | Medium | ⬜ Not started |

---

## Feature 1 – General (Account-Level) Availability

### 1.1 Context

Today, users edit availability **per project**. This is repetitive when the same weekly schedule applies across many projects. We want:

- A **general availability** per user (their default weekly schedule)
- Projects to **inherit** this general availability automatically
- If a user customizes availability in a specific project, that project becomes **decoupled** from the general availability (with a clear warning)

### 1.2 What to build

1. **Account-level availability** – One canonical weekly schedule per user
2. **Project availability inheritance** – When project availability is empty, use general availability as the base
3. **Per-project override** – When users change availability on a project, warn that:
   - Changes only affect that project
   - Future edits to general availability will no longer automatically update that project

---

### 1.3 Data model

**File:** `groupsync/prisma/schema.prisma`

We already have `Availability` records keyed by `(projectId, userId)` or `guestMemberId`. Add a **general availability** table:

```prisma
model UserAvailabilityDefault {
  id        String   @id @default(uuid())
  userId    String   @unique @map("user_id")
  slots     String   @default("[]") // same JSON format as Availability.slots
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_availability_defaults")
}
```

Notes:
- `slots` uses the same `TimeSlot[]` JSON structure as `Availability.slots`
- Only one row per user (via `@unique`)

Run migration (or db push) after adding this model.

---

### 1.4 Types

**File:** `groupsync/types/index.ts`

Add:

```ts
export interface UserAvailabilityDefault {
  id: string;
  userId: string;
  slots: string;      // JSON string of TimeSlot[]
  updatedAt: string;
}
```

---

### 1.5 API – general availability

Create endpoints to read and write a user’s default availability.

**File:** `groupsync/app/api/user/availability-default/route.ts`

- `GET /api/user/availability-default`
  - Auth: `getServerSession(authOptions)`
  - Returns `{ slots: TimeSlot[] }` or `[]` if none
- `POST /api/user/availability-default`
  - Body: `{ slots: TimeSlot[] }`
  - Validates slots using the same rules as `/api/availability` route
  - Upserts `UserAvailabilityDefault` for the current user

Use the existing slot validation logic from `app/api/availability/route.ts` where possible (extract a shared helper if needed).

---

### 1.6 Using general availability in projects

**File:** `groupsync/app/project/[id]/page.tsx`

Current behavior:
- Fetches `Availability` per project and passes `initialSlots`/`teamAvailabilities` into `AvailabilityTab`

New behavior:

1. **Server data:**
   - When computing `currentUserAvailability` and `teamAvailabilities`, do:
     - For each user:
       - If project-specific `Availability` exists and has non-empty slots for the week ⇒ use it
       - Else:
         - Look up `UserAvailabilityDefault` for that user
         - Use those slots as their availability for this project
   - You can:
     - Load defaults for all users via a batch query on `UserAvailabilityDefault` by `userId`

2. **Marking overrides (optional but helpful):**
   - In `AvailabilityTab`, add a flag like `isUsingGeneralDefault` (boolean) for the current user:
     - True when project has no explicit Availability and we’re displaying default
     - False when project has its own saved Availability
   - Pass this flag into `AvailabilityTab` via props if needed.

---

### 1.7 UI – editing availability

**File:** `groupsync/components/project/AvailabilityTab.tsx`

Behavior:

1. **When using general default in a project**:
   - Show a subtle notice:  
     “You’re currently using your general availability for this project.”
   - When the user makes a change AND saves:
     - Save into `Availability` for this project via `/api/availability`
     - From then on, this project is considered **overridden** (server logic will prefer project-specific slots)
     - Notice changes to:  
       “You’ve customized availability for this project. Changes here won’t affect your general availability.”

2. **Where to edit general availability**:
   - Add a link/button in `AvailabilityTab` (and/or on dashboard) like:
     - “Edit my general availability”
   - This should take the user to either:
     - A dedicated page (`/settings/availability`)  
     - Or a modal on the dashboard
   - On that screen, re-use `AvailabilityGrid` but wired to `UserAvailabilityDefault` (`/api/user/availability-default`).

3. **Warning summary**:
   - When user is about to save changes on a project where they were previously using general default:
     - Optional: show a small confirm text (non-blocking):
       - “This will customize availability for this project only.”

---

## Feature 2 – Google Calendar Import → Availability

### 2.1 Context

Manually setting availability is tedious if users already maintain a calendar. We want:

- One-time or recurring **import** of Google Calendar busy times
- Derive availability from free slots (the times *not* marked busy on their calendar)
- Allow users to add **personal block times** (e.g., “don’t show me as free at 7am even if calendar is open”)

> Note: This requires OAuth with Google. If a full integration is too heavy, structure the code so it can be stubbed or toggled off based on environment config.

### 2.2 OAuth & Google Calendar API Setup

**Docs to consult (in `aiDocs`):**  
`groupsync/aiDocs/auth-flow.md` and `groupsync/aiDocs/api-guide.md` for patterns.

High-level steps (do these in configuration, not code):

1. Create a Google Cloud project
2. Enable Google Calendar API
3. Create OAuth client (Web application)
4. Configure allowed redirect URIs (e.g., `https://your-domain.com/api/oauth/google/callback`)
5. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment (.env)

---

### 2.3 Backend: OAuth endpoints

**Files:**
- `groupsync/app/api/oauth/google/route.ts` – starts OAuth flow
- `groupsync/app/api/oauth/google/callback/route.ts` – handles callback

Responsibilities:

1. **Start OAuth:**
   - Generate Google OAuth URL with scopes:
     - `https://www.googleapis.com/auth/calendar.readonly`
   - Redirect user to Google

2. **Handle callback:**
   - Exchange `code` for access token + refresh token
   - Store tokens per user (securely):
     - Option A: New `UserCalendarToken` model
       ```prisma
       model UserCalendarToken {
         userId      String  @id @map("user_id")
         accessToken String  @map("access_token")
         refreshToken String @map("refresh_token")
         expiryDate  DateTime @map("expiry_date")

         user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

         @@map("user_calendar_tokens")
       }
       ```
   - Redirect back to a settings page (e.g., `/settings/availability`) with a success message

> If full token management is out of scope now, still document these steps; you can start with a mock/stubbed API later.

---

### 2.4 Backend: Import busy times

**File:** `groupsync/app/api/user/availability-import/google/route.ts`

Endpoint: `POST /api/user/availability-import/google`

Steps:

1. Auth via session
2. Check the user has valid calendar tokens
3. Call Google Calendar API:
   - For the upcoming N weeks (configurable, e.g., 4 weeks)
   - Get events where `transparency != 'transparent'` and `status != 'cancelled'`
   - Determine **busy intervals** in local time or UTC (be consistent)
4. Convert busy intervals into **per-week, per-day** busy blocks matching our `TimeSlot` structure.

5. Derive availability:
   - Start from a full-day schedule (e.g., 6am–11pm) for each day
   - Subtract busy blocks
   - Apply user-defined personal blocks (see next subsection)

6. Decide where to store:
   - Short term: update `UserAvailabilityDefault.slots` with the imported data
   - Optionally: store imported ranges separately if you need to merge later

Return:
```json
{
  "success": true,
  "slots": [ /* TimeSlot[] representing new default availability */ ]
}
```

---

### 2.5 Personal blocked times (overrides on top of calendar)

Some times have no events but should be treated as unavailable (e.g., early mornings).

**Option A (lighter):**  
Model personal blocks as simple recurring rules:

```prisma
model UserAvailabilityBlock {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  day       Int      @map("day")       // 0-6 (Sunday-Saturday)
  startHour Float    @map("start_hour")
  endHour   Float    @map("end_hour")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_availability_blocks")
}
```

Use these during import (and when computing availability) to subtract from otherwise free time.

**API:** `GET/POST/DELETE /api/user/availability-blocks`  
Similar to `UserAvailabilityDefault` management.

**UI:**
- On the availability settings page:
  - Allow a user to add recurring rules like:
    - Day: Any day of week
    - Time: 7:00–8:00am
  - Show them in a list and allow removal.

> For MVP, even a single \"block early mornings\" slider (e.g. 7am–9am) per weekday is acceptable; the model above allows arbitrary blocks.

---

### 2.6 UI – availability settings page

**File:** `groupsync/app/settings/availability/page.tsx` (new)

Sections:

1. **General availability grid**
   - Use `AvailabilityGrid` connected to `UserAvailabilityDefault`
   - Buttons:
     - \"Save general availability\"
     - \"Import from Google Calendar\" (if connected)

2. **Google Calendar connection**
   - If not connected:
     - Show a \"Connect Google Calendar\" button that starts OAuth flow
   - If connected:
     - Show \"Re-import from Google Calendar\" button (calls `/api/user/availability-import/google`)

3. **Personal block rules**
   - UI to add/edit `UserAvailabilityBlock` rules

Link this settings page:
- From the dashboard
- From `AvailabilityTab` via a link like \"Edit my general availability\".

---

## Feature 3 – Zoom / Google Meet Link Creation for Meetings

### 3.1 Context

Users currently schedule meetings but must manually create meeting links in external tools. We want:

- Buttons on the meeting creation/scheduling flow to:
  - Create a Google Meet link
  - Optionally, create a Zoom link (if configured)
- Store the link with the meeting and show it wherever meetings are listed.

---

### 3.2 Data model

**File:** `groupsync/prisma/schema.prisma`

Extend the `Meeting` model:

```prisma
model Meeting {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  title       String
  date        String   // YYYY-MM-DD
  startTime   String   // HH:mm
  endTime     String   // HH:mm
  createdById String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  videoUrl    String?  @map("video_url") // new: link to Google Meet or Zoom

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy   User?    @relation(fields: [createdById], references: [id], onDelete: SetNull)

  @@map("meetings")
}
```

Run migration / db push after this change.

---

### 3.3 API – create meeting link

Depending on complexity, you can either:

1. **Use Google Calendar API to create an event with a Meet link**
   - Requires the calendar OAuth from Feature 2
   - When scheduling a meeting in GroupSync:
     - Call Google Calendar API to insert an event with `conferenceData` (`hangoutsMeet`)
     - Extract the `hangoutLink` and store it in `Meeting.videoUrl`

2. **Use Zoom API**
   - Requires a Zoom JWT / OAuth app
   - Similar approach: create a meeting and store the join URL

**API endpoint suggestion:**

**File:** `groupsync/app/api/meetings/[id]/video-link/route.ts`

- `POST /api/meetings/[id]/video-link`
  - Body: `{ provider: 'google' | 'zoom' }`
  - Auth: only the meeting creator or project owner
  - Behavior:
    - If provider === 'google':
      - Use the user’s Google Calendar token to create an event with `conferenceData`
      - Save `videoUrl` from the response
    - If provider === 'zoom':
      - Create a Zoom meeting via API and save join URL
  - Return `{ videoUrl: string }`

For MVP (no external API yet), you may:
- Stub this with a fake URL structure and mark in docs as a placeholder.

---

### 3.4 UI – meeting creation & display

**Files:**
- `groupsync/components/project/MeetingFinder.tsx`
- `groupsync/components/project/ScheduleMeetingModal.tsx`
- `groupsync/components/project/UpcomingMeetings.tsx`

Steps:

1. **Meeting creation modal**
   - After the time is selected (before final save), add options:
     - Checkbox: “Create Google Meet link”
     - (Optional) Checkbox: “Create Zoom link”
   - When user confirms:
     - Create the basic Meeting in the DB
     - Then, if a provider is selected:
       - Call `POST /api/meetings/[id]/video-link` and update the meeting with `videoUrl`

2. **Upcoming meetings list**
   - In `UpcomingMeetings`, show:
     - If `videoUrl` exists:
       - A \"Join meeting\" button (opens in new tab)
     - If not:
       - (Optional) a small button/menu to \"Create link\" (same API as above)

3. **Availability + meeting summary**
   - Show the meeting link anywhere else meetings are surfaced (e.g., on the schedule tab) using the same pattern.

---

## Verification

### General availability
- [ ] General availability can be set/updated via settings page
- [ ] New projects correctly inherit general availability for each member
- [ ] Editing availability on a specific project only affects that project
- [ ] Warning/notice clearly indicates when a project is using general vs overridden availability

### Google Calendar import
- [ ] User can connect Google Calendar (if enabled)
- [ ] Import uses busy times to mark them unavailable
- [ ] Free times become available, minus personal block rules
- [ ] Imported schedule correctly populates general availability
- [ ] Personal block rules correctly override open times

### Meeting links
- [ ] User can request a Google Meet (or Zoom) link when creating a meeting
- [ ] Link is stored in `Meeting.videoUrl`
- [ ] \"Join meeting\" button appears in upcoming meetings and opens the link
- [ ] Type checks and lints pass after implementation

