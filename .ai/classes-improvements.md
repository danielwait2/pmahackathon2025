# GroupSync – Classes & Member Improvements

> **For AI agents:** This document describes two related improvements:
> 1. Account-level classes and a reusable \"my classes\" dropdown
> 2. Directly adding people to projects (public profiles + join requests)
>
> Follow these steps before implementing changes.

---

## Summary

| # | Feature                                                | Priority | Effort | Status   |
|---|--------------------------------------------------------|----------|--------|----------|
| 1 | Account-level classes + \"my classes\" dropdown        | High     | Medium | ⬜ Not started |
| 2 | Directly add members to projects (public profiles + requests) | High     | High   | ⬜ Not started |
| 3 | Calendar feed → classes + assignments/projects        | Medium   | Medium | ⬜ Not started |

---

## Feature 1 – Account-Level Classes & Global Class Dropdown

### 1.1 Context

We already have:
- A global `Class` model (normalized, deduplicated, lowercased)
- Per-project class selection

What’s missing:
- Each **user** should be able to define the set of classes *they* are currently in
- That list should:
  - Appear in a **\"My classes\"** section on the home/dashboard after login
  - Feed into class selection dropdowns for projects/assignments
  - Always include easy-access entries like **\"Personal\"** and **\"Other\"** for non-class work

### 1.2 What to build

1. **User class enrollments** – Associate users with the global `Class` rows they care about
2. **Account-level UI** – A \"My classes\" section on the post-login home/dashboard page
3. **Dropdown integration** – When choosing a class on a project:
   - Show \"My classes\" first
   - Still allow searching the global class catalog
   - Always include `Personal` and `Other` options

---

### 1.3 Data model

**File:** `groupsync/prisma/schema.prisma`

Add a join model to link users to classes:

```prisma
model UserClass {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  classId   String   @map("class_id")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([userId, classId])
  @@map("user_classes")
}
```

Then:
- Run: `cd groupsync && DATABASE_URL="file:./prisma/dev.db" npx prisma db push` (or your normal migration flow)

**Types:** `groupsync/types/index.ts`

```ts
export interface UserClass {
  id: string;
  userId: string;
  classId: string;
  createdAt: string;
}
```

You may not need a dedicated interface if you only use the Prisma client result directly in server components, but having one is helpful for API responses.

---

### 1.4 API – manage a user’s classes

Create a small REST surface for managing \"My classes\".

**File:** `groupsync/app/api/user/classes/route.ts`

Endpoints:

1. **GET /api/user/classes**
   - Auth via `getServerSession(authOptions)`
   - Returns the current user’s classes with both `classId` and `name`
   - Example response:
     ```json
     [
       { "id": "uc1", "classId": "c1", "name": "cs 101" },
       { "id": "uc2", "classId": "c2", "name": "math 220" }
     ]
     ```

2. **POST /api/user/classes**
   - Body: `{ name: string }`
   - Steps:
     - Normalize name via existing `normalizeClassName` (global class utils)
     - If empty after normalization → `400`
     - Look up or create `Class` (global)
     - Upsert `UserClass` for `(userId, classId)`
   - Return new `UserClass` + class name

3. **DELETE /api/user/classes/[id]**
   - Delete a specific `UserClass` row (soft-remove from \"My classes\"), *not* the global `Class`

> Note: Do **not** allow deletion of `Class` rows through this API; they are shared.

---

### 1.5 Dashboard UI – \"My Classes\" section

**Files:**
- `groupsync/app/dashboard/page.tsx`
- `groupsync/components/dashboard/DashboardShell.tsx`
- (New) `groupsync/components/dashboard/MyClassesPanel.tsx`

Steps:

1. **Fetch user classes on server:**
   - In `dashboard/page.tsx`, after fetching the user:
     - Query `UserClass` joined with `Class` for the current user
     - Map to `{ id, classId, name }`
     - Pass down to `DashboardShell` as `userClasses`

2. **Render \"My Classes\" panel**
   - Create `MyClassesPanel` with:
     - List of current classes
     - A simple add form (text input) that:
       - On submit → calls `POST /api/user/classes`
       - Shows errors via `toast` if any
     - A remove button for each class:
       - Calls `DELETE /api/user/classes/[id]` then refreshes
   - Place this panel on the main dashboard, likely in the left or right column near \"Your Projects\" or \"My Tasks\".

3. **Validation & UX**
   - Allow users to type classes however they like, but:
     - Show them in nice display form (using existing `formatClassNameForDisplay`)
     - Handle duplicates gracefully (UserClass `@@unique` + API dedupe)

---

### 1.6 Integrate \"My classes\" into project class selection

**Files:**
- `groupsync/components/project/ClassSelector.tsx`
- `groupsync/components/dashboard/CreateProjectWizard.tsx`

Steps:

1. **Fetch user classes in `ClassSelector`**
   - Extend `ClassSelector` to optionally fetch `/api/user/classes` when a `showMyClasses` prop is true.
   - Keep existing global class fetch from `/api/classes`.

2. **UI grouping**
   - In the dropdown:
     - Show a \"My classes\" group at the top (user’s classes)
     - Below that, the full catalog (global classes)
   - Ensure shared instances (same `classId`) are not duplicated visually.

3. **Special options: `Personal` and `Other`**
   - Treat these as **synthetic options** in the dropdown:
     - `value="__personal__"` → stored as a special case (e.g., `classId = null` + `classLabel = 'personal'`)
     - `value="__other__"` → same idea
   - Decide how to store them:
     - Option A: Add extra fields to `Project` like `classLabel: 'personal' | 'other' | null`
     - Option B: Allow `Project.classId` to be `null` and store label in a simple string field
   - Document the chosen approach in `groupsync/aiDocs/database-schema.md`.

4. **CreateProjectWizard integration**
   - Where we already show `ClassSelector`, pass `showMyClasses` so the user’s chosen classes appear first.

---

## Feature 2 – Directly Add Members to Projects (Public Profiles + Requests)

### 2.1 Context

Currently, members join primarily via invite links. We want:
- A way to **search for people** and invite them directly to a project
- Users can set their profile as **public** or **private**
  - Public users appear in a searchable list
  - Private users can still be invited via direct email, but don’t show in browse results
- When someone is invited:
  - They see a **request** and can **accept or decline**
- Recently added collaborators should be easy to find at the top when adding members (\"Recent collaborators\").

---

### 2.2 Data model

**File:** `groupsync/prisma/schema.prisma`

1. **User visibility fields**

```prisma
model User {
  // existing fields...
  isPublic          Boolean   @default(false) @map("is_public")
  // Optional: cached search fields if needed later
  // firstName      String?   @map("first_name")
  // lastName       String?   @map("last_name")
}
```

2. **Project member requests**

```prisma
model ProjectMemberRequest {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  fromUserId  String   @map("from_user_id") // requester (project member or owner)
  toUserId    String   @map("to_user_id")   // person being invited
  status      String   @default("pending")  // 'pending' | 'accepted' | 'declined'
  createdAt   DateTime @default(now()) @map("created_at")
  respondedAt DateTime? @map("responded_at")

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fromUser    User     @relation("RequestFromUser", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser      User     @relation("RequestToUser", fields: [toUserId], references: [id], onDelete: Cascade)

  @@map("project_member_requests")
}
```

> Note: Adjust relation names if needed to avoid conflicts with existing ones.

Run `prisma db push` / migration after updating.

---

### 2.3 Types

**File:** `groupsync/types/index.ts`

Add types as needed:

```ts
export interface ProjectMemberRequest {
  id: string;
  projectId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt: string | null;
}
```

---

### 2.4 API – user visibility and search

1. **User visibility setting**

**File:** `groupsync/app/api/user/profile/route.ts`

- `GET /api/user/profile` – returns basic profile + `isPublic`
- `PATCH /api/user/profile` – accepts `{ isPublic?: boolean }` and updates the user

2. **Search public users**

**File:** `groupsync/app/api/users/search/route.ts`

Endpoint: `GET /api/users/search?query=...`

- Auth via `getServerSession(authOptions)`
- `query` can be:
  - An email
  - Part of a name
- Search:
  - Only users with `isPublic = true`
  - `OR` exact email match if the current user knows the email (even if `isPublic = false`) – this is optional and should be called out explicitly if you choose it.
- Return a limited set of fields:
  ```json
  [
    { "id": "u1", "name": "Jane Doe", "email": "jane@example.com" },
    { "id": "u2", "name": "John Smith", "email": "john@example.com" }
  ]
  ```

Add simple rate limiting / debounce on the client side to avoid spamming this endpoint.

---

### 2.5 API – project member requests

**File:** `groupsync/app/api/projects/[id]/member-requests/route.ts`

Endpoints:

1. **POST /api/projects/[id]/member-requests**
   - Body: `{ toUserId: string }`
   - Auth: requester must be a member of the project (preferably owner/manager)
   - Behavior:
     - Prevent duplicate pending requests for same `(projectId, toUserId)`
     - Create `ProjectMemberRequest` with status `pending`
     - Optionally: notify the target user (UI later)

2. **GET /api/projects/[id]/member-requests?role=target|requester`**
   - For project context, you may instead prefer a global \"My Invites\" endpoint – see below.

3. **Global invites endpoint (recommended)**  
   **File:** `groupsync/app/api/user/invites/route.ts`

   - `GET /api/user/invites`
     - Returns all `ProjectMemberRequest` where `toUserId = currentUserId` and `status = 'pending'`
     - Include project name and requester name

4. **Respond to invite**

   **File:** `groupsync/app/api/user/invites/[id]/route.ts`

   - `PATCH /api/user/invites/[id]`
   - Body: `{ action: 'accept' | 'decline' }`
   - Behavior:
     - Ensure `toUserId` matches current user
     - If `accept`:
       - Set `status = 'accepted'`, `respondedAt = now()`
       - **Create `ProjectMember`** for that project and user if not already present
     - If `decline`:
       - Set `status = 'declined'`, `respondedAt = now()`

---

### 2.6 UI – user privacy setting (public vs private)

**Files:**
- `groupsync/components/dashboard/DashboardShell.tsx`
- New: `groupsync/components/dashboard/AccountPrivacyToggle.tsx`

Steps:

1. **Fetch `isPublic`**:
   - In `dashboard/page.tsx`, fetch user profile including `isPublic`
   - Pass down to `DashboardShell` as `userIsPublic`

2. **Render toggle**:
   - Add a simple toggle (e.g., a switch or segmented control) labeled:
     - \"Profile visibility: Private / Public\"
   - On change:
     - Call `PATCH /api/user/profile` with new `isPublic`
     - Show confirmation via `toast`

Messaging suggestions:
- Private: \"You can be invited by email, but you won’t appear in public search.\"
- Public: \"Your name and email can appear in search results when others add members to projects.\"

---

### 2.7 UI – add members by search

**Files:**
- `groupsync/components/project/TeamTab.tsx`
- New: `groupsync/components/project/AddMemberDialog.tsx`

Steps:

1. **Add \"Add member\" button in Team tab**
   - In `TeamTab`, for owners:
     - Add a button: \"Add member\" that opens `AddMemberDialog`

2. **`AddMemberDialog` behavior**
   - Search box:
     - User types part of a name or an email
     - Debounced calls to `GET /api/users/search?query=...`
   - Results list:
     - Show name + email, maybe an avatar
     - For each result, an \"Invite\" button:
       - Calls `POST /api/projects/[id]/member-requests` with `toUserId`
       - Disable or show \"Requested\" if a pending request already exists

3. **Recent collaborators section**
   - Above the search results, show a \"Recent collaborators\" row:
     - Compute on the server (in `TeamTab` props) as users the current user has recently shared a project with:
       - E.g., query `ProjectMember` where `userId = currentUserId`, find other users on those projects, sort by most recent `joinedAt`, and pick top N.
     - Render as clickable chips/buttons:
       - Clicking sends a member request or immediately adds (depending on your preference)

> Hint: Document the exact \"recent collaborators\" query logic in `groupsync/aiDocs/architecture.md` once finalized.

---

### 2.8 UI – handling incoming requests

**Files:**
- New: `groupsync/components/dashboard/MyInvitesPanel.tsx`
- `groupsync/app/dashboard/page.tsx`

Steps:

1. **Fetch invites**:
   - In `dashboard/page.tsx`, call `GET /api/user/invites`
   - Pass the invites to `DashboardShell` / `MyInvitesPanel`

2. **Render invites list**:
   - For each invite:
     - Show project name, requester name, when invited
     - Show buttons:
       - **Accept** → `PATCH /api/user/invites/[id]` `{ action: 'accept' }`
       - **Decline** → same endpoint with `{ action: 'decline' }`
   - On accept:
     - Refresh dashboard to show the project in the user’s project list

---

## Verification

### Classes
- [ ] User can add classes to \"My classes\" from the dashboard
- [ ] Classes are normalized and deduplicated
- [ ] \"My classes\" appear first in the project class dropdown
- [ ] `Personal` and `Other` options are visible and behave as expected
- [ ] Removing a class from \"My classes\" does not delete it globally

### Direct member add
- [ ] User can toggle profile privacy (public/private)
- [ ] Public users appear in search results; private users do not (unless specifically allowed by email)
- [ ] Owner can open \"Add member\" dialog and search by name or email
- [ ] Invites create `ProjectMemberRequest` rows with `pending` status
- [ ] Target user sees invites on their dashboard
- [ ] Accepting an invite adds them as a `ProjectMember` and updates the project list
- [ ] Declining does not add them and marks request as `declined`
- [ ] Recently added collaborators appear at the top of the add-member UI
- [ ] Type checks and lints pass after all changes

---

## Feature 3 – Calendar Feed → Classes & Assignments/Projects

### 3.1 Context

Many classes already publish **iCal/ICS feeds** with all assignments and events. Example formats:

- Learning Suite class feed:  
  `https://learningsuite.byu.edu/iCalFeed/ical.php?courseID=Obk0gLGZ6ywV`
- Canvas calendar feed:  
  `https://byu.instructure.com/feeds/calendars/user_n0e3egOe7FlxJv2LuecXIQsbdAPnaqxP0XtmWp0Z.ics`

We want:

1. A way for users to **paste a calendar URL** to create a class in GroupSync
2. Parse the feed and **turn events into assignments or projects**:
   - **Default:** treat events as assignments
   - If the title/description contains words like \"group\" or \"project\", treat as a **project**
3. Map:
   - **Due date** → assignment due date / project deadline
   - **Details** → task/description field

### 3.2 What to build

1. **Calendar import entry point** – UI where a user can paste a calendar URL and associate it with a class
2. **ICS parser** – Backend logic to parse `.ics` feeds into a normalized event structure
3. **Classification & mapping** – Decide per event whether it becomes:
   - A **Project** (for group/project-style items)
   - An **Assignment** (Task) belonging to a class
4. **Idempotent sync** – Avoid creating duplicate tasks/projects on repeated imports

---

### 3.3 Data model

**File:** `groupsync/prisma/schema.prisma`

Add a way to remember calendar feeds per class/user:

```prisma
model ClassCalendarFeed {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")      // owner of this integration
  classId   String   @map("class_id")     // global Class this feed belongs to
  url       String   @map("url")
  provider  String   @map("provider")     // 'learningsuite' | 'canvas' | 'other'
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  class     Class    @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@map("class_calendar_feeds")
}
```

You can extend this later with fields for last sync time, sync status, etc.

> Assumption: **Assignments** are represented as `Task` rows; we’ll use \"assignment\" in the UI but map to tasks in the DB.

---

### 3.4 API – add calendar link and import events

**File:** `groupsync/app/api/classes/import-calendar/route.ts`

Endpoint: `POST /api/classes/import-calendar`

Body:

```json
{
  "name": "STRAT 560-002",
  "calendarUrl": "https://learningsuite.byu.edu/iCalFeed/ical.php?courseID=Obk0gLGZ6ywV"
}
```

Steps:

1. **Auth & user** – Use `getServerSession(authOptions)` to get current user.
2. **Normalize class**:
   - Use existing `normalizeClassName` on `name`
   - Find or create global `Class` row
   - Ensure a `UserClass` row exists so this class shows up under \"My classes\"
3. **Create or update feed:**
   - Detect provider by URL (`learningsuite`, `canvas`, or `other`)
   - Upsert `ClassCalendarFeed` for `(userId, classId, provider)`
4. **Fetch ICS feed server-side:**
   - Use `fetch(calendarUrl)` on the server
   - Pass raw text to an ICS parser helper (see next section)
5. **Map events → internal structures**:
   - For each event:
     - Extract:
       - `summary` (title)
       - `description`
       - `dtstart` (date/time or all-day date)
       - `dtend` (optional)
   - Build a normalized `ImportedCalendarEvent` object:

```ts
interface ImportedCalendarEvent {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
}
```

6. **Create projects vs assignments:**
   - Determine type by inspecting `title` and `description` (case-insensitive):
     - If includes `group`, `project`, or similar keywords ⇒ treat as **Project**
     - Else ⇒ treat as **Assignment** (Task)

7. **Persist:**
   - **Project path:**
     - Create a `Project`:
       - `name` = event title
       - `description` = event description
       - `deadline` = `start` (or `end` if more appropriate)
       - Link to `Class` via `classId` if you’ve added that relationship
     - Ensure project members include the current user

   - **Assignment path:**
     - Decide which project to attach tasks to:
       - Option A: Create a single \"Class [name]\" project per class and attach tasks there
       - Option B: Attach to an existing project the user selects during import (document which you choose)
     - Create a `Task`:
       - `title` = event title
       - `description` = event description (full ICS DESCRIPTION)
       - `dueDate` = `start` (for all-day events, treat as due at local end-of-day or midday)
       - `status` = `'todo'`

8. **Idempotency (no duplicates):**
   - Include the ICS `UID` in your mapping:
     - Option: Add a `sourceUid` + `sourceProvider` on `Task` and `Project` (or a small `CalendarImportMapping` table)
   - Before creating a task/project, check if an item already exists for that `(userId, classId, uid)` and update instead of duplicating.

Return:

```json
{
  "classId": "c1",
  "createdProjects": 3,
  "createdAssignments": 27
}
```

---

### 3.5 ICS parsing helper

**File:** `groupsync/lib/calendar-import.ts` (new)

Implement a small helper to parse ICS feeds:

```ts
export interface ImportedCalendarEvent {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
}

export function parseIcsFeed(icsText: string): ImportedCalendarEvent[] {
  // Option A: use a library like `node-ical`
  // Option B: implement a minimal parser:
  // - Split by "BEGIN:VEVENT" / "END:VEVENT"
  // - For each block, read lines starting with UID:, SUMMARY:, DESCRIPTION:, DTSTART, DTEND
  // - Parse DTSTART/DTEND into Date objects (handle VALUE=DATE vs full timestamps)
  // - Normalize line folding (lines starting with space are continuations)
  // Return an array of ImportedCalendarEvent
}
```

Guidelines:
- Handle both all-day (`DTSTART;VALUE=DATE:YYYYMMDD`) and timed events (`DTSTART:YYYYMMDDTHHMMSSZ`)
- Preserve full DESCRIPTION for assignment details

---

### 3.6 UI – adding a calendar link

**Files:**
- `groupsync/components/dashboard/MyClassesPanel.tsx`
- Or a new `groupsync/components/dashboard/AddClassFromCalendarDialog.tsx`

Flow:

1. In \"My Classes\" panel, add an **\"Add from calendar\"** button.
2. Dialog fields:
   - Class name (text input)
   - Calendar URL (text input)
   - Provider (auto-detected from URL, but allow override if needed)
3. On submit:
   - Call `POST /api/classes/import-calendar`
   - Show progress / success counts
   - Refresh dashboard so:
     - The class appears under \"My classes\"
     - The related project(s)/assignments appear in the appropriate lists

Optional:
- For Learning Suite vs Canvas:
  - Show example placeholders:
    - \"Example (Learning Suite): https://learningsuite.byu.edu/iCalFeed/ical.php?courseID=... \"
    - \"Example (Canvas): https://byu.instructure.com/feeds/calendars/....ics\"

---

### 3.7 Classification rules (assignment vs project)

Implement a simple heuristic:

- **Project keywords** (case-insensitive, search in title + description):
  - `\"group project\"`, `\"group assignment\"`, `\"group work\"`, `\"project\"`, `\"team project\"`
- If any project keyword matches ⇒ create a **Project**
- Else ⇒ create an **Assignment** (Task)

You can refine this over time or allow per-import overrides in the UI.

---

### 3.8 Verification

- [ ] User can paste a Learning Suite calendar URL and create/import a class
- [ ] User can paste a Canvas calendar URL and create/import a class
- [ ] Events become **assignments** by default (tasks with due dates and descriptions)
- [ ] Events containing \"group\"/\"project\" in the title/description become **projects**
- [ ] Each event’s due date is correctly mapped from `DTSTART` (and `DTEND` if used)
- [ ] Assignment details from ICS DESCRIPTION appear in the task description
- [ ] Re-running import does not create duplicate tasks/projects for the same ICS events
- [ ] Imported classes appear under \"My classes\" and are usable throughout the app
- [ ] Type checks and lints pass after implementation