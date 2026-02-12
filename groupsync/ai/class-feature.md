# GroupSync - Add Classes Feature

> **For AI agents:** This document describes how to add a classes feature. Read this file before starting work. Follow the same workflow as `IMPROVEMENTS-TODO.md` and `IMPROVEMENTS-CHECKLIST.md`.

---

## Summary

| #   | Feature                                | Priority | Effort | Status   |
| --- | -------------------------------------- | -------- | ------ | -------- |
| 1   | Add classes with dropdown + new option | High     | Medium | Complete |

---

## Implementation Steps (check off as completed)

### Step 1: Schema

- [x] Add `Class` model to `prisma/schema.prisma`
- [x] Add `classId` and `class` relation to `Project` model
- [x] Run migration / db push

### Step 2: Data cleaning utility

- [x] Create `lib/class-utils.ts`
- [x] Implement `normalizeClassName()` (trim, lowercase, collapse spaces)
- [x] Implement `formatClassNameForDisplay()` (title case for UI)

### Step 3: API

- [x] Create `app/api/classes/route.ts`
- [x] GET – return all classes ordered by name
- [x] POST – accept `{ name }`, normalize, dedupe, create or return existing

### Step 4: ClassSelector component

- [x] Create `components/project/ClassSelector.tsx`
- [x] Dropdown with existing classes + "None"
- [x] Input + "Add" button to create new class
- [x] Display names with `formatClassNameForDisplay`

### Step 5: CreateProjectWizard integration

- [x] Add `ClassSelector` to step 1
- [x] Add `classId` state and pass to API on create
- [x] Reset `classId` in wizard reset

### Step 6: Projects API

- [x] Update `app/api/projects/route.ts` to accept `classId`
- [x] Validate class exists when `classId` provided
- [x] Save `classId` to project on create

### Step 7: Types

- [x] Add `Class` interface to `types/index.ts`
- [x] Add `classId` and `class` to Project interfaces
- [x] Add `classId` and `className` to `DashboardProject`

### Step 8: Project page & display

- [x] Include `class` in project page Prisma query
- [x] Pass `className` to `ProjectHeader`
- [x] Display class in `ProjectHeader` with BookOpen icon
- [x] Include class in dashboard project fetch
- [x] Display class in `ProjectCard` when present

---

## Context

Users need to assign classes (e.g. course names, categories) to their projects or tasks. Classes should be a shared, app-wide list so that when any user adds a class, it becomes available to all users in a dropdown. This avoids duplicate entries like "CS 101" vs "cs 101" vs "CS101" by normalizing and deduplicating.

---

## What to build

1. **Database** - A global `Class` model storing all classes any user has added
2. **Dropdown UI** - When adding/editing a project (or task), show a dropdown of existing classes
3. **Add new option** - Allow users to add a new class that gets saved to the global list
4. **Data cleaning** - Normalize all class names: trim whitespace, store lowercase, collapse repeated spaces
5. **Deduplication** - Before inserting a new class, check if it already exists (case-insensitive)

---

## Technical implementation

### Schema (Prisma)

```prisma
model Class {
  id        String    @id @default(uuid())
  name      String    @unique @map("name")  // stored lowercase, trimmed
  createdAt DateTime  @default(now()) @map("created_at")

  projects  Project[]

  @@map("classes")
}
```

- Add `classId String? @map("class_id")` to `Project` model
- Add relation: `class Class? @relation(fields: [classId], references: [id], onDelete: SetNull)`
- Run migration

(If classes should also apply to tasks, add `classId` to `Task` similarly.)

### Data cleaning utility

Create `lib/class-utils.ts`:

```typescript
/**
 * Normalizes a class name for storage:
 * - Trim leading/trailing whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces to single space
 * - Optional: remove or restrict special characters
 */
export function normalizeClassName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}
```

### API endpoints

**GET /api/classes**

- Returns all classes, ordered by name
- Used to populate dropdown

**POST /api/classes**

- Body: `{ name: string }`
- Normalize name with `normalizeClassName`
- Reject empty strings after normalization
- Check if class with same normalized name exists; if so, return existing (no duplicate)
- Create new class and return it

### UI: Class selector component

Create `components/ui/ClassSelector.tsx` (or `components/project/ClassSelector.tsx`):

- **Combobox pattern:** Input + dropdown list
- **Options:** Existing classes from `GET /api/classes`
- **"Add new" / custom value:** When user types something not in the list, show "Add '[value]'" option; on select, call `POST /api/classes` with that name
- **Display:** Show class names with proper casing for display (capitalize first letter, or store a `displayName` if needed). For simplicity, display the stored lowercase value with first-letter caps: `name.charAt(0).toUpperCase() + name.slice(1)`
- **Clearing:** Allow "None" or empty to unset the class

### Where to integrate

- **CreateProjectWizard** - Add optional "Class" field (dropdown + add new) in step 1
- **Project settings / edit** - If projects can be edited, add class selector there
- **Project model** - Include `classId` and `class` in project queries and serialization

---

## Files to create

| File                                   | Purpose                                         | Status |
| -------------------------------------- | ----------------------------------------------- | ------ |
| `lib/class-utils.ts`                   | `normalizeClassName()` for data cleaning        | [x]    |
| `app/api/classes/route.ts`             | GET (list) and POST (create) classes            | [x]    |
| `components/project/ClassSelector.tsx` | Dropdown + add-new combobox for class selection | [x]    |

---

## Files to modify

| File                                           | Changes                                                               | Status |
| ---------------------------------------------- | --------------------------------------------------------------------- | ------ |
| `prisma/schema.prisma`                         | Add `Class` model; add `classId` and relation to `Project`            | [x]    |
| `types/index.ts`                               | Add `Class` interface; add `classId` / `class` to `Project` if needed | [x]    |
| `components/dashboard/CreateProjectWizard.tsx` | Add ClassSelector; include `classId` in create project payload        | [x]    |
| `app/api/projects/route.ts`                    | Accept `classId` when creating project; validate it exists            | [x]    |
| `app/project/[id]/page.tsx`                    | Include `class` in project fetch; pass to ProjectHeader               | [x]    |
| `components/project/ProjectHeader.tsx`         | Add className prop; display with BookOpen icon                        | [x]    |
| `app/dashboard/page.tsx`                       | Include class in project fetch; pass classId, className               | [x]    |
| `components/dashboard/ProjectCard.tsx`         | Display className when present                                        | [x]    |

---

## Data cleaning rules

| Rule              | Example input                         | Stored value                |
| ----------------- | ------------------------------------- | --------------------------- |
| Trim whitespace   | `"  CS 101  "`                        | `"cs 101"`                  |
| Lowercase         | `"CS 101"`                            | `"cs 101"`                  |
| Collapse spaces   | `"CS    101"`                         | `"cs 101"`                  |
| Empty after clean | `"   "`                               | Reject                      |
| Dedupe on insert  | Add `"CS 101"` when `"cs 101"` exists | Return existing, no new row |

---

## Verification

- [x] Classes are stored in database with normalized names (lowercase, trimmed)
- [x] Dropdown shows all existing classes
- [x] User can select an existing class from dropdown
- [x] User can add a new class; it appears in dropdown for future use
- [x] Adding a class that normalizes to an existing one does not create a duplicate
- [x] Empty or whitespace-only input is rejected
- [x] Class displays correctly in UI (e.g. with proper casing for readability)
- [x] Project creation/update persists `classId` correctly
- [x] Projects can be filtered or displayed by class (if applicable)

---

## Related Files

- `groupsync/ai/IMPROVEMENTS-TODO.md` - Other improvements
- `groupsync/ai/IMPROVEMENTS-CHECKLIST.md` - Checklist format
- `groupsync/AGENTS.md` - Agent entry point
