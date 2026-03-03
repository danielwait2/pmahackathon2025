# GroupSync – Personal vs Group Assignments/Projects

> **For AI agents:** This document describes how to distinguish **personal** vs **group** projects/assignments, adjust the project UI accordingly, and add dashboard filters. Follow these steps before implementing changes.

---

## Summary

| # | Feature                                                      | Priority | Effort | Status   |
|---|--------------------------------------------------------------|----------|--------|----------|
| 1 | Personal vs group projects/assignments                       | High     | Medium | ✅ Complete |
| 2 | Personal projects: tasks only (no availability)              | High     | Medium | ✅ Complete |
| 3 | Tasks on personal projects auto-assigned to the current user | High     | Low    | ✅ Complete |
| 4 | Dashboard filter: group-only / personal-only / all           | Medium   | Low    | ✅ Complete |

---

## 1. Concept & Behavior

### 1.1 Definitions

- **Group project**:
  - Has multiple members (or is intended for a team)
  - Shows **Tasks**, **Availability**, and **Team** tabs as today
- **Personal project**:
  - Owned and used by a single user (though you may still store it in `Project`)
  - Shows **Tasks** tab only (no Availability tab)
  - Tasks created here are **always assigned to the current user**

### 1.2 Desired behavior

1. When creating a new project, the user chooses **Group** vs **Personal**
2. Personal projects:
   - Do **not** show availability UI
   - Do show task UI
   - New tasks are automatically assigned to the current user
3. Dashboard:
   - Has a filter/switch to show:
     - **All** projects
     - **Group** projects only
     - **Personal** projects only

---

## 2. Data Model

**File:** `groupsync/prisma/schema.prisma`

### 2.1 Add project type

Extend the `Project` model:

```prisma
model Project {
  id           String    @id @default(uuid())
  name         String
  description  String?
  deadline     DateTime?
  classId      String?   @map("class_id")
  createdById  String    @map("created_by")
  inviteCode   String    @unique @map("invite_code")
  shareToken   String?   @unique @map("share_token")
  createdAt    DateTime  @default(now()) @map("created_at")

  // NEW: personal vs group
  isPersonal   Boolean   @default(false) @map("is_personal")

  createdBy       User                @relation("ProjectCreator", fields: [createdById], references: [id])
  class           Class?              @relation(fields: [classId], references: [id], onDelete: SetNull)
  members         ProjectMember[]
  availability    Availability[]
  tasks           Task[]
  teamAgreement   TeamAgreement?
  meetings        Meeting[]

  @@map("projects")
}
```

Notes:
- `isPersonal = false` ⇒ default group project (current behavior)
- `isPersonal = true` ⇒ personal project

Run migration (or `prisma db push`) after updating.

---

### 2.2 Types

**File:** `groupsync/types/index.ts`

Add `isPersonal` to `Project` and `DashboardProject`:

```ts
export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  className: string | null;
  isPersonal: boolean;  // NEW
  // ...
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  class: Class | null;
  isPersonal: boolean;  // NEW
  createdById: string;
  inviteCode: string;
  createdAt: string;
}
```

Ensure all mapping code that builds `DashboardProject`/`Project` objects is updated to include `isPersonal`.

---

## 3. Creating Personal vs Group Projects

### 3.1 API – project creation

**File:** `groupsync/app/api/projects/route.ts`

Current behavior:
- Accepts `name`, `description`, `deadline`, etc.

Update request body to accept:

```ts
const { name, description, deadline, classId, isPersonal, responseTimeHours, meetingFrequency, communicationChannel } = body;
```

When creating the `Project`, include:

```ts
isPersonal: isPersonal === true,
```

Guardrails:
- If `isPersonal === true`, you can:
  - Still create a `ProjectMember` for the owner
  - But treat this project as single-user in the UI

---

### 3.2 CreateProjectWizard – group vs personal toggle

**File:** `groupsync/components/dashboard/CreateProjectWizard.tsx`

Add a project type selector (similar to how assignments vs projects were handled before, or like assignment vs project toggles you already have):

1. **State:**

```ts
const [isPersonal, setIsPersonal] = useState(false);
```

2. **Reset logic:**
- In `resetWizard()`, reset `isPersonal` to `false`

3. **UI in step 1:**
- Above the name field, add a radio group:
  - `Project type: ( ) Group ( ) Personal`
  - When user chooses `Personal`, `setIsPersonal(true)`, else `false`

4. **Submit payload:**

```ts
body: JSON.stringify({
  name: name.trim(),
  description: description.trim() || null,
  deadline: deadline.toISOString().slice(0, 10),
  classId,
  isPersonal,
  responseTimeHours: responseTimeMap[responseTime] ?? 24,
  meetingFrequency,
  communicationChannel: channel,
}),
```

5. **Copy tweaks:**
- Titles/buttons:
  - `Create Group Project` vs `Create Personal Project` (optional but nice)

---

## 4. Project Page Behavior – Tabs for Personal vs Group

### 4.1 Pass `isPersonal` into project page

**File:** `groupsync/app/project/[id]/page.tsx`

When fetching `project` from Prisma, ensure you select `isPersonal`:

```ts
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    // ...
  },
});
```

And when rendering:

```tsx
<ProjectTabs
  projectId={project.id}
  currentUserId={member.userId || member.memberId}
  currentMemberId={member.memberId}
  actualUserId={member.userId ?? member.memberId}
  isOwner={/* existing logic */}
  isPersonal={project.isPersonal}   // NEW
  // ...
/>
```

Also pass `isPersonal` to `ProjectHeader` if you want a badge.

---

### 4.2 Hide Availability tab for personal projects

**File:** `groupsync/components/project/ProjectTabs.tsx`

Extend props:

```ts
interface ProjectTabsProps {
  projectId: string;
  currentUserId: string;
  currentMemberId: string;
  actualUserId: string | null;
  isOwner: boolean;
  isPersonal?: boolean;  // NEW
  // ...
}
```

Use `isPersonal` to adjust tabs:

```tsx
export function ProjectTabs({ isPersonal = false, ... }: ProjectTabsProps) {
  const defaultTab = 'tasks'; // availability may be hidden

  return (
    <Tabs defaultValue={defaultTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        {!isPersonal && <TabsTrigger value="availability">Availability</TabsTrigger>}
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TasksTab ... />
      </TabsContent>

      {!isPersonal && (
        <TabsContent value="availability">
          <AvailabilityTab ... />
        </TabsContent>
      )}

      <TabsContent value="team">
        <TeamTab ... />
      </TabsContent>
    </Tabs>
  );
}
```

Result:
- **Group project:** Tasks + Availability + Team (unchanged)
- **Personal project:** Tasks + Team, **no** Availability tab

---

## 5. Personal Tasks Auto-Assigned to Current User

### 5.1 Task creation API

**Files:**
- `groupsync/app/api/tasks/route.ts`
- `groupsync/app/api/tasks/[id]/route.ts` (for updates if needed)

When creating a new task, look up the project:

```ts
const project = await prisma.project.findUnique({
  where: { id: body.projectId },
  select: { isPersonal: true },
});
```

If `project.isPersonal === true`:
- Ignore any `assignedTo` from the client
- Set `assignedTo` to the current user ID (from session), if available

Example:

```ts
let assignedTo: string | null = null;
if (project?.isPersonal && session?.user?.id) {
  assignedTo = session.user.id;
} else if (typeof body.assignedTo === 'string') {
  assignedTo = body.assignedTo;
}
```

Then pass `assignedTo` into the Prisma create call.

> Note: For guests or non-auth users, you may need a different mapping; document your choice if you support personal projects for guests.

### 5.2 Frontend – remove assignee controls for personal projects (optional)

**Files:**
- `groupsync/components/project/AddTaskModal.tsx`
- `groupsync/components/project/TaskDetailModal.tsx`

If you pass `isPersonal` into these components (via props), you can:
- Hide or disable the assignee picker for personal projects
- Show a note like: “Tasks in personal projects are always assigned to you.”

This prevents confusion when the backend overrides `assignedTo` anyway.

---

## 6. Dashboard Filter – Group / Personal / All

### 6.1 Server: include `isPersonal` in dashboard data

**File:** `groupsync/app/dashboard/page.tsx`

When mapping `projectRows` to `DashboardProject`, include:

```ts
isPersonal: project.isPersonal ?? false,
```

### 6.2 Client: filter control

**Files:**
- `groupsync/components/dashboard/DashboardShell.tsx`
- `groupsync/components/dashboard/ProjectList.tsx`

In `DashboardShell`, add state for the filter:

```ts
const [projectFilter, setProjectFilter] = useState<'all' | 'group' | 'personal'>('all');
```

Compute filtered projects:

```ts
const filteredProjects = useMemo(() => {
  switch (projectFilter) {
    case 'group':
      return projects.filter((p) => !p.isPersonal);
    case 'personal':
      return projects.filter((p) => p.isPersonal);
    default:
      return projects;
  }
}, [projects, projectFilter]);
```

Render a simple toggle UI near the \"Your Projects\" heading:

- **Buttons or segmented control:**
  - All
  - Group
  - Personal

Each sets `projectFilter` appropriately.

Pass `filteredProjects` into `ProjectList`.

---

## 7. Verification

### Personal vs group projects
- [x] User can choose Personal vs Group when creating a project
- [x] Personal projects show **Tasks** but **not** **Availability**
- [x] Group projects show all tabs as before

### Personal tasks behavior
- [x] Tasks created in personal projects are automatically assigned to the current user
- [ ] (Optional) Assignee controls are hidden or disabled for personal projects

### Dashboard filter
- [x] Dashboard shows all projects by default
- [x] Switching to **Group** shows only non-personal projects
- [x] Switching to **Personal** shows only personal projects
- [x] Switching back to **All** shows everything
- [x] Filtered counts and lists update correctly without errors

