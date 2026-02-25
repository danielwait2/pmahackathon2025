# GroupSync – Archive Projects Feature

> **For AI agents:** This document describes how to add project archiving with a \"Past projects\" view. Follow these steps before implementing changes.

---

## Summary

| # | Feature                                       | Priority | Effort | Status   |
|---|----------------------------------------------|----------|--------|----------|
| 1 | Archive / restore projects + Past projects  | High     | Medium | ⬜ Not started |

---

## Context

As users finish classes or group work, their project list becomes cluttered with old projects. They want a simple way to:

- Archive projects they are done with
- Hide archived projects from the main \"Your Projects\" dashboard
- Still access archived projects via a **\"Past projects\"** view
- Undo an archive (restore a project to the active list)

Archiving **does not delete** data. All tasks, meetings, availability, and notes remain intact.

---

## What to build

1. **Archive flag on projects** – A way to mark a project as archived (and store when it was archived)
2. **Archive / restore actions** – Simple UI controls to archive a project and undo (restore)
3. **Dashboard filtering** – Default view shows only active projects; a \"Past projects\" toggle shows archived projects
4. **Visibility rules** – Archived projects:
   - Do **not** appear in the default project list
   - Remain accessible by direct URL
   - Show a clear \"Archived\" indicator

---

## Technical implementation

### Step 1: Schema change (Prisma)

- **File:** `groupsync/prisma/schema.prisma`

Add an archive timestamp to the `Project` model:

```prisma
model Project {
  // ... existing fields
  archivedAt  DateTime? @map("archived_at")
  // ...
}
```

- Run: `cd groupsync && DATABASE_URL="file:./prisma/dev.db" npx prisma db push` (or `prisma migrate dev` in your environment)
- Convention: a project is **archived** when `archivedAt IS NOT NULL`

### Step 2: Types

- **File:** `groupsync/types/index.ts`

Update interfaces:

```ts
export interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  className: string | null;
  isAssignment: boolean;
  archivedAt: string | null; // new
  // ...
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  classId: string | null;
  class: Class | null;
  isAssignment: boolean;
  archivedAt: string | null; // new
  // ...
}
```

---

### Step 3: API – archive / restore project

**Option A (recommended):** Add a `PATCH /api/projects/[id]` endpoint.

- **File:** `groupsync/app/api/projects/[id]/route.ts` (create if not present)

Responsibilities:

- Validate auth via `getServerSession(authOptions)`
- Ensure the current user is the project owner (or has appropriate role)
- Accept body: `{ archived: boolean }`
- When `archived === true`: set `archivedAt = new Date()`
- When `archived === false`: set `archivedAt = null`
- Return the updated project (id, name, archivedAt)

Example shape:

```ts
export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const archived = body.archived === true;

  // Ensure user is project owner
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, createdById: true },
  });

  if (!project || project.createdById !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      archivedAt: archived ? new Date() : null,
    },
    select: { id: true, archivedAt: true },
  });

  return NextResponse.json(updated);
}
```

---

### Step 4: Dashboard data – active vs archived

- **File:** `groupsync/app/dashboard/page.tsx`

Update the projects query to fetch **both active and archived**:

```ts
const projectRows = await prisma.project.findMany({
  where: { id: { in: projectIds } },
  include: {
    class: { select: { id: true, name: true } },
  },
  orderBy: { createdAt: 'desc' },
});
```

In the mapping to `DashboardProject`, include `archivedAt`:

```ts
archivedAt: project.archivedAt?.toISOString() ?? null,
```

Then, in the React tree (DashboardShell / ProjectList), derive:

- **Active projects:** `projects.filter((p) => !p.archivedAt)`
- **Archived projects:** `projects.filter((p) => !!p.archivedAt)`

---

### Step 5: Dashboard UI – \"Past projects\" toggle

- **Files:**
  - `groupsync/components/dashboard/DashboardShell.tsx`
  - `groupsync/components/dashboard/ProjectList.tsx`

Add a simple view toggle:

```ts
const [view, setView] = useState<'active' | 'archived'>('active');

const activeProjects = projects.filter((p) => !p.archivedAt);
const archivedProjects = projects.filter((p) => !!p.archivedAt);
const visibleProjects = view === 'active' ? activeProjects : archivedProjects;
```

Add buttons near the \"Your Projects\" heading:

- **\"Active projects\"** (default)
- **\"Past projects\"** – when selected, show only archived projects

Pass `visibleProjects` to `ProjectList`.

Optional: show a small badge with counts:

- Active: `activeProjects.length`
- Past: `archivedProjects.length`

---

### Step 6: Archive / restore controls in the UI

#### 6.1 Project card quick action (optional)

- **File:** `groupsync/components/dashboard/ProjectCard.tsx`

For owners, add a small menu or button (e.g., a three-dot menu) with:

- \"Archive project\" when `!project.archivedAt`
- \"Restore project\" when `project.archivedAt`

Each action:

1. Calls `PATCH /api/projects/[id]` with `{ archived: true/false }`
2. On success, triggers `router.refresh()` to update the dashboard

Also:

- Show an \"Archived\" badge when `project.archivedAt` is set (especially in the Past projects view)

#### 6.2 Project page header action

- **File:** `groupsync/components/project/ProjectHeader.tsx`

In the owner controls area, add:

- \"Archive project\" button when active
- \"Restore project\" button when archived

On click:

- Call `PATCH /api/projects/[id]`
- On success, refresh the page (e.g., `router.refresh()` from the page or a passed callback)

Also:

- Show a prominent \"Archived\" badge or text in the header when `archivedAt` is not null

---

### Step 7: Visibility and behavior rules

1. **Dashboard default** – Only **active** projects (`archivedAt === null`) are shown
2. **Past projects view** – Only archived projects (`archivedAt !== null`) are shown
3. **Direct access** – Archived projects remain accessible via `/project/[id]`
4. **Joining** – Joining an archived project is allowed or disabled based on your product decision (document your choice)
5. **Editing** – By default, editing tasks/availability is still allowed on archived projects unless you explicitly disable it

Document any additional rules in `groupsync/aiDocs/context.md` if you change behavior.

---

## Files to modify

| File                                           | Changes                                                                                      |
|-----------------------------------------------|----------------------------------------------------------------------------------------------|
| `groupsync/prisma/schema.prisma`              | Add `archivedAt` to `Project` model                                                          |
| `groupsync/types/index.ts`                    | Add `archivedAt` to `Project` and `DashboardProject`                                         |
| `groupsync/app/api/projects/[id]/route.ts`    | New `PATCH` handler to set/clear `archivedAt`                                                |
| `groupsync/app/dashboard/page.tsx`            | Include `archivedAt` in project rows; pass to dashboard components                           |
| `groupsync/components/dashboard/DashboardShell.tsx` | Add view toggle (Active vs Past projects); compute visible projects                    |
| `groupsync/components/dashboard/ProjectList.tsx` | Use `visibleProjects` list                                                                   |
| `groupsync/components/dashboard/ProjectCard.tsx`   | Show \"Archived\" badge; add archive/restore actions (optional)                              |
| `groupsync/components/project/ProjectHeader.tsx`   | Add archive/restore button and \"Archived\" indicator for owners                             |

---

## Verification

- [ ] New `archivedAt` column exists in the `projects` table
- [ ] User can archive a project from the project page
- [ ] User can restore an archived project
- [ ] Archived projects no longer appear in the default \"Your Projects\" view
- [ ] \"Past projects\" view only shows archived projects
- [ ] Switching between Active and Past views updates the list correctly
- [ ] Archived projects remain accessible via direct URL
- [ ] API returns `archivedAt` for projects in both dashboard and project page queries
- [ ] Non-owners cannot archive or restore projects (authorization enforced in API)

