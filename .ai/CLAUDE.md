# GroupSync AI Agent Instructions

> **Read this file first** when working on any part of the GroupSync project. This file contains universal rules that all AI agents (Claude, Cursor, Gemini, Codex, etc.) must follow.

---

## 📍 Project Context

**Before starting any work, read:**
- [groupsync/aiDocs/context.md](../groupsync/aiDocs/context.md) - Project overview, tech stack, current focus
- [.ai/WORKFLOWS.md](./WORKFLOWS.md) - Git workflows, commit rules, PR process

**For detailed implementation guidance:**
- Check `groupsync/ai/roadmaps/` for current phase and task tracking
- Check `groupsync/ai/guides/` for library documentation and API references

---

## 🎯 Core Behavioral Guidelines

### 1. **Ask Before Acting on Complex Work**
- If a task requires architectural changes, new dependencies, or affects multiple files, **ask the user for approval** before implementing
- Present options and tradeoffs when multiple approaches exist
- Don't assume you know the user's preference

### 2. **No Over-Engineering**
- Build **only** what is needed for the current task
- No "just in case" features or premature abstractions
- Don't add error handling for scenarios that can't happen
- Don't create helpers/utilities for one-time operations
- Three similar lines of code is better than a premature abstraction
- Keep solutions simple and focused

### 3. **Flag Uncertainty, Don't Guess**
- If you're unsure about:
  - API signatures or library usage
  - Database schema details
  - User requirements or intent
  - Whether code exists or needs to be created
- **STOP and ask** rather than guessing or hallucinating

### 4. **Delete, Don't Comment Out**
- If code is unused, delete it completely
- No backwards-compatibility hacks like renaming unused `_vars` or `// removed` comments
- Trust git history for recovery if needed

### 5. **Respect Existing Patterns**
- Read existing code before suggesting modifications
- Match the coding style and patterns already in the codebase
- Don't refactor working code unless explicitly asked

---

## ✅ Pre-Completion Checklist (MANDATORY)

**Before marking any task as complete, you MUST:**

1. **Run Type Checking**
   ```bash
   cd groupsync && npx tsc --noEmit
   ```
   - Zero type errors allowed

2. **Run Linting**
   ```bash
   cd groupsync && npm run lint
   ```
   - Fix all linting errors

3. **Test Locally**
   ```bash
   cd groupsync && npm run dev
   ```
   - Verify the app starts without errors
   - Manually test the feature you implemented
   - Check both desktop and mobile viewports if UI changes

4. **Spawn Verification Sub-Agent**
   - Use a separate AI agent/task to review your changes
   - The verification agent should check:
     - Code quality and potential bugs
     - Security issues (XSS, SQL injection, etc.)
     - Performance concerns
     - Missing edge cases
   - Address all issues found before proceeding

5. **Update Documentation**
   - If you added/changed APIs, update `groupsync/aiDocs/api-guide.md`
   - If you modified components, update `groupsync/aiDocs/component-library.md`
   - If you changed the database, update `groupsync/aiDocs/database-schema.md`

**Only after ALL checks pass should you commit changes.**

---

## 🚫 Never Do This

- Never update git config
- Never run destructive git commands (`push --force`, `reset --hard`, `clean -f`) unless explicitly requested
- Never skip hooks (`--no-verify`, `--no-gpg-sign`)
- Never force push to main/master
- Never commit without running the pre-completion checklist
- Never commit sensitive files (.env, credentials, API keys)
- Never use `git add .` or `git add -A` - add specific files by name

---

## 🔄 Workflow Reference

For detailed git workflows, commit message standards, and PR requirements, see:
- [.ai/WORKFLOWS.md](./WORKFLOWS.md)

---

## 📚 Project-Specific Context

### Tech Stack
- **Frontend:** Next.js 14 (App Router), React 19, TypeScript
- **UI:** Tailwind CSS v4, shadcn/ui components
- **Backend:** Next.js API routes
- **Database:** PostgreSQL via Neon, Prisma ORM
- **Auth:** NextAuth.js
- **Deployment:** Vercel (frontend), Neon (database)

### Key Directories
- `app/` - Next.js app router (pages & API routes)
- `components/` - React components (project/, dashboard/, auth/, ui/)
- `lib/` - Utilities (auth, db, helpers)
- `prisma/` - Database schema and migrations
- `types/` - TypeScript type definitions

### Current Architecture
- Server components for data fetching
- Client components for interactivity
- API routes for mutations
- Prisma for database access
- NextAuth for authentication with credentials provider

---

## 🎨 Code Quality Standards

### TypeScript
- Use strict mode
- Define proper types, avoid `any`
- Use interfaces for object shapes
- Export types from `types/index.ts`

### React Components
- Use functional components with hooks
- Prefer server components unless interactivity needed
- Keep components focused (single responsibility)
- Extract reusable logic into custom hooks

### Database
- All queries through Prisma
- Use transactions for multi-step operations
- Include proper error handling
- Follow the schema in `prisma/schema.prisma`

### Styling
- Use Tailwind CSS classes
- Use shadcn/ui components when available
- Mobile-first responsive design
- Consistent spacing with Tailwind scale

---

## 🔍 When You Need Help

1. **Check existing docs first:**
   - `groupsync/aiDocs/` for architecture and patterns
   - `groupsync/ai/guides/` for library documentation

2. **Search the codebase:**
   - Look for similar implementations
   - Check how existing features are built

3. **Ask the user:**
   - Present your findings
   - Suggest options
   - Get direction before proceeding

---

## 📝 Notes for Specific AI Tools

### Claude Code
- Use the Task tool for complex multi-step features
- Use Glob/Grep for searching, not bash commands
- Break down work with TodoWrite

### Cursor
- This file serves as your `.cursorrules` foundation
- See `.cursorrules` for any Cursor-specific additions

### GitHub Copilot
- See `.github/copilot-instructions.md` for additional context

### Gemini / Other Tools
- Follow these universal guidelines
- Adapt to your tool's specific capabilities

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
