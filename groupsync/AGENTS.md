# GroupSync – Instructions for AI Agents

> **Read this file first** when working on the GroupSync codebase. It directs you to improvement tasks and project context.

---

## Improvement Tasks

Before starting feature work, check the `ai/` folder for pending improvements:

| File | Purpose |
|------|---------|
| **`ai/IMPROVEMENTS-TODO.md`** | Full instructions: what to build, how to implement, files to modify, verification steps |
| **`ai/IMPROVEMENTS-CHECKLIST.md`** | Checklist to track progress; update as you complete items |

**Path from this directory:** `groupsync/ai/`

### Current improvements to implement

1. **Create meeting calendar event** – Add to Google Calendar / Outlook / Apple Calendar from scheduled meetings  
2. **Combine Team View + Meeting Finder** – Show team availability and meeting suggestions on one page  
3. **Onboarding tutorial** – First-time user guide for navigation and core flows  
4. **Due dates and reminders** – Add due dates and reminder dates to tasks; default reminder is 1 day before due date  

---

## Project Structure

- `app/` – Next.js app router (pages, API routes)
- `components/` – React components (`project/`, `dashboard/`, `auth/`, `ui/`)
- `lib/` – Utilities (auth, db, calendar helpers)
- `prisma/` – Database schema and migrations

---

## Workflow

1. Read `ai/IMPROVEMENTS-TODO.md` for the improvement you are implementing
2. Use `ai/IMPROVEMENTS-CHECKLIST.md` to track and check off tasks
3. Run the app (`npm run dev` in `groupsync/`) to verify changes
4. Update the checklist when done

---

## Related Documentation

- Root `ai/next-improvements.md` – Other planned improvements (week navigation, edit tasks, etc.)
- `README.md` – General project setup
