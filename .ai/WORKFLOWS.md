# GroupSync Development Workflows

> **Strict workflows for git, commits, PRs, and testing.** All AI agents must follow these rules.

---

## 🔄 Git Workflow

### Branch Strategy

```
main (protected)
├── feature/descriptive-name
├── fix/bug-description
└── refactor/what-changed
```

**Branch Naming:**
- `feature/` - New features (e.g., `feature/calendar-integration`)
- `fix/` - Bug fixes (e.g., `fix/auth-redirect-loop`)
- `refactor/` - Code improvements (e.g., `refactor/task-components`)
- `docs/` - Documentation only (e.g., `docs/api-guide-update`)

**Rules:**
- Always branch from `main`
- Keep branches focused (one feature/fix per branch)
- Delete branches after merging

---

## ✅ Pre-Commit Verification (MANDATORY)

**Every commit MUST pass this checklist:**

### 1. Type Checking
```bash
cd groupsync && npx tsc --noEmit
```
- ✅ Zero type errors
- ✅ No `@ts-ignore` comments added

### 2. Linting
```bash
cd groupsync && npm run lint
```
- ✅ Zero linting errors
- ✅ Auto-fix applied where possible (`npm run lint -- --fix`)

### 3. Local Testing
```bash
cd groupsync && npm run dev
```
- ✅ App starts without errors on port 3000
- ✅ Feature works as expected
- ✅ No console errors in browser
- ✅ Tested on both desktop (1920px) and mobile (375px) if UI changes

### 4. Verification Sub-Agent Review

**Spawn a verification agent to review your changes:**

```markdown
Review the following changes for:
1. Security issues (XSS, injection, exposed secrets)
2. Performance problems (N+1 queries, unnecessary re-renders)
3. Edge cases not handled (null checks, empty arrays, etc.)
4. Code quality (complexity, readability, maintainability)
5. Breaking changes (API compatibility, database migrations)

Files changed: [list files]
Summary of changes: [brief description]
```

**Address ALL issues** found by the verification agent before committing.

### 5. Documentation Updates

**If you changed:**
- API routes → Update `groupsync/aiDocs/api-guide.md`
- Components → Update `groupsync/aiDocs/component-library.md`
- Database schema → Update `groupsync/aiDocs/database-schema.md`
- Auth flow → Update `groupsync/aiDocs/auth-flow.md`
- Deployment → Update `groupsync/aiDocs/deployment.md`

---

## 📝 Commit Message Format

### Structure
```
<type>(<scope>): <short summary>

<optional detailed description>

Co-Authored-By: [AI Agent Name] <noreply@example.com>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `docs` - Documentation only
- `style` - Formatting, missing semicolons, etc.
- `test` - Adding tests
- `chore` - Updating build tasks, package manager configs, etc.

### Scopes (optional but recommended)
- `auth` - Authentication/authorization
- `api` - API routes
- `db` - Database/Prisma
- `ui` - UI components
- `dashboard` - Dashboard feature
- `project` - Project view feature
- `tasks` - Task management
- `calendar` - Availability/scheduling

### Examples

**Good:**
```
feat(calendar): add Google Calendar export for meetings

- Generate .ics files for scheduled meetings
- Add download buttons to UpcomingMeetings component
- Include all meeting details in calendar event

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Good:**
```
fix(auth): resolve redirect loop after login

Users were getting stuck in infinite redirect between /login and /dashboard.
Fixed by checking session state before redirecting in middleware.

Fixes #42

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Bad:**
```
update files
```

**Bad:**
```
WIP - trying to fix the thing
```

---

## 🚀 Commit Process

### Step-by-Step

1. **Verify all checks passed** (see Pre-Commit Verification above)

2. **Stage specific files** (never use `git add .`)
   ```bash
   git status  # Review what changed
   git add path/to/file1.ts path/to/file2.tsx  # Add specific files
   ```

3. **Review staged changes**
   ```bash
   git diff --staged  # Review exactly what you're committing
   ```

4. **Commit with proper message**
   ```bash
   git commit -m "$(cat <<'EOF'
   feat(tasks): add due date reminders

   - Add reminderDate field to Task model
   - Create reminder notification system
   - Display reminder badges in task cards

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
   EOF
   )"
   ```

5. **Verify commit succeeded**
   ```bash
   git log -1  # Check the commit
   git status  # Ensure working tree is clean
   ```

---

## 🔀 Pull Request Process

### Before Creating PR

1. **Ensure branch is up to date**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main  # Or merge main into your branch
   ```

2. **Run full verification**
   - All pre-commit checks
   - Build succeeds: `npm run build`
   - No new TypeScript errors

3. **Update roadmap checklist**
   - Mark completed tasks in `groupsync/ai/roadmaps/`
   - Update status in relevant feature docs

### PR Title Format
```
[Type] Brief description of changes
```

Examples:
- `[Feature] Add Google Calendar integration`
- `[Fix] Resolve authentication redirect loop`
- `[Refactor] Simplify task status updates`

### PR Description Template

```markdown
## Summary
Brief description of what this PR does and why.

## Changes
- List of specific changes made
- Link to related issues/tasks

## Testing
- [ ] Type checking passed
- [ ] Linting passed
- [ ] Manual testing completed
- [ ] Tested on mobile viewport
- [ ] Verification agent review completed

## Screenshots (if UI changes)
[Add screenshots here]

## Checklist
- [ ] All pre-commit verification passed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Ready for review

## Related Issues
Closes #123
```

### Review Process

1. **Self-review first** - Review your own changes before requesting review
2. **Request review** - Assign to team members
3. **Address feedback** - Make requested changes promptly
4. **Update checklist** - Mark tasks complete after addressing

---

## 🧪 Testing Guidelines

### Manual Testing Checklist

**For every feature:**
- [ ] Happy path works (expected user flow)
- [ ] Error states display properly
- [ ] Loading states appear when appropriate
- [ ] Empty states show when no data
- [ ] Form validation works
- [ ] Mobile responsive (375px width)
- [ ] Desktop works (1920px width)
- [ ] No console errors
- [ ] No React warnings
- [ ] Accessibility (keyboard navigation, screen reader friendly)

### Performance Checks

**Watch for:**
- Unnecessary re-renders (use React DevTools Profiler)
- N+1 database queries (check Prisma logs)
- Large bundle sizes (check Next.js build output)
- Slow API responses (check Network tab)

---

## 🚨 When Things Go Wrong

### If Pre-Commit Check Fails

**DO NOT:**
- Skip the check with `--no-verify`
- Commit anyway and "fix it later"
- Force push to override

**DO:**
- Fix the error
- Re-run verification
- Create a NEW commit (don't amend if it changes meaning)

### If Build Breaks

1. Check error message carefully
2. Fix the issue
3. Run `npm run build` locally to verify
4. Commit the fix
5. Update team if blocking others

### If Tests Fail

1. Run tests locally: `npm run dev`
2. Identify failing test
3. Fix the code or update the test (as appropriate)
4. Verify all tests pass
5. Commit fix

---

## 📊 Workflow Diagram

```
Start Task
    ↓
Read .ai/CLAUDE.md + aiDocs/context.md
    ↓
Create feature branch
    ↓
Implement feature
    ↓
Run tsc --noEmit → Pass?
    ↓
Run npm run lint → Pass?
    ↓
Run npm run dev → Works?
    ↓
Spawn verification agent → Issues found?
    ↓ (If issues: fix and re-verify)
Update documentation
    ↓
Stage specific files (git add path/to/file)
    ↓
Commit with proper message
    ↓
Push to branch
    ↓
Create Pull Request
    ↓
Review & merge
    ↓
Delete branch
    ↓
Update roadmap
```

---

## 🎯 Quick Reference

### Before Every Commit
```bash
# From groupsync/ directory
npx tsc --noEmit && npm run lint && npm run dev

# Then spawn verification agent
# Then update docs
# Then commit specific files
```

### Commit Template
```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <summary>

<description>

Co-Authored-By: AI Agent Name <noreply@example.com>
EOF
)"
```

### PR Checklist
- [ ] All pre-commit checks passed
- [ ] Documentation updated
- [ ] Roadmap updated
- [ ] PR description complete
- [ ] Ready for review

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
