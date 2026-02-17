# GroupSync AI Orchestration System - Setup Complete! 🎉

**Created:** 2026-02-14

Your comprehensive AI agent orchestration system is now ready for multi-agent collaboration across Cursor, Claude, Gemini, and Codex!

---

## 📁 What Was Created

### 1. **Root `.ai/` Folder** (Universal AI Rules)

```
.ai/
├── CLAUDE.md                      # Master AI instructions (all agents read this!)
├── WORKFLOWS.md                   # Git, commit, PR workflows
└── VERIFICATION_AGENT_PROMPT.md   # Pre-commit verification template
```

**Purpose:** Universal rules that ALL AI tools follow, regardless of which tool your team uses.

---

### 2. **`groupsync/aiDocs/`** (Tracked Team Knowledge)

```
groupsync/aiDocs/
├── context.md                # Project overview, tech stack, current focus
├── architecture.md           # System design, patterns, data flow
├── api-guide.md              # API endpoints reference
├── component-library.md      # Reusable components catalog
├── database-schema.md        # Prisma schema with examples
├── auth-flow.md              # Authentication implementation
├── deployment.md             # Vercel + Neon deployment guide
└── coding-standards.md       # TypeScript, React, styling standards
```

**Purpose:** Shared team documentation that's tracked in git. When you document something here, everyone benefits.

---

### 3. **`groupsync/ai/`** (Personal Workspace - GITIGNORED)

```
groupsync/ai/
├── README.md                 # Folder usage guide
├── guides/                   # Library docs, API references
├── roadmaps/                 # Phase plans, task tracking
│   ├── IMPROVEMENTS-TODO.md
│   ├── IMPROVEMENTS-CHECKLIST.md
│   ├── class-feature.md
│   └── assignment-feature.md
└── notes/                    # Personal development notes
```

**Purpose:** Your personal workspace for notes, experiments, and work-in-progress docs. Not committed to git.

---

### 4. **Tool-Specific Configs**

```
groupsync/
├── .cursorrules                          # Cursor AI instructions
└── .github/
    └── copilot-instructions.md           # GitHub Copilot instructions
```

**Purpose:** Optimized instructions for specific AI tools. Each tool can have its own config while following universal `.ai/CLAUDE.md` rules.

---

### 5. **Updated `.gitignore` Files**

**Root `.gitignore`:**
- Ignores personal AI configs (CLAUDE.md, .cursorrules, .geminirc)
- Keeps `.ai/` folder (tracked)

**`groupsync/.gitignore`:**
- Ignores `ai/` folder (personal workspace)
- Ignores `.cursorrules` (personal)
- Keeps `.github/` folder (tracked)

---

## 🚀 How to Use This System

### For AI Agents (Read This First!)

**When starting any task:**

1. **Read `.ai/CLAUDE.md`** - Universal rules and behavioral guidelines
2. **Read `.ai/WORKFLOWS.md`** - Git and commit rules
3. **Read `groupsync/aiDocs/context.md`** - Project overview
4. **Check `groupsync/ai/roadmaps/`** - Current tasks and priorities

**Before committing:**

1. Run `npx tsc --noEmit` (type check)
2. Run `npm run lint` (linting)
3. Run `npm run dev` (test locally)
4. Spawn verification agent using `.ai/VERIFICATION_AGENT_PROMPT.md`
5. Update relevant docs in `aiDocs/`
6. Commit with proper message format

---

### For Team Members

**Working with Different AI Tools:**

- **Claude Code**: Automatically reads `.ai/CLAUDE.md`
- **Cursor**: Reads `.cursorrules` (which references `.ai/CLAUDE.md`)
- **GitHub Copilot**: Reads `.github/copilot-instructions.md`
- **Gemini/Other**: Point them to `.ai/CLAUDE.md` as universal instructions

**All tools will follow the same rules!**

---

## 📋 Workflow Example

### Scenario: Adding a New Feature

**Step 1: Agent Initialization**
```
Agent reads:
1. .ai/CLAUDE.md (universal rules)
2. .ai/WORKFLOWS.md (git rules)
3. groupsync/aiDocs/context.md (project context)
4. groupsync/ai/roadmaps/ (current tasks)
```

**Step 2: Implementation**
```
Agent:
- Follows coding standards from aiDocs/coding-standards.md
- References architecture.md for patterns
- Checks api-guide.md for API conventions
- Updates component-library.md if adding components
```

**Step 3: Pre-Commit Verification**
```
1. npx tsc --noEmit → ✅ Pass
2. npm run lint → ✅ Pass
3. npm run dev → ✅ Works
4. Spawn verification agent → ✅ No issues
5. Update aiDocs/api-guide.md (added new endpoint)
```

**Step 4: Commit**
```bash
git add app/api/new-feature/route.ts
git add groupsync/aiDocs/api-guide.md

git commit -m "$(cat <<'EOF'
feat(api): add new feature endpoint

- Created POST /api/new-feature
- Added validation for request body
- Updated API documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## 🎯 Key Features of This System

### ✅ **Multi-Agent Compatible**
- Works with Cursor, Claude, Gemini, Codex
- Universal `.ai/CLAUDE.md` ensures consistency
- Tool-specific configs optimize for each tool

### ✅ **Strict Quality Gates**
- Mandatory pre-commit checks (tsc, lint, dev, verification agent)
- No commits without passing all checks
- Verification agent catches security, performance, and quality issues

### ✅ **Organized Documentation**
- `aiDocs/` for shared team knowledge (tracked in git)
- `ai/` for personal notes and work-in-progress (gitignored)
- Clear separation prevents doc chaos

### ✅ **Workflow Enforcement**
- Detailed git workflows in `.ai/WORKFLOWS.md`
- Commit message format standards
- PR checklist and requirements
- No destructive git operations without explicit permission

### ✅ **No Over-Engineering**
- Core principle: build only what's needed
- Delete unused code, don't comment it out
- Flag uncertainty instead of guessing
- Keep solutions simple and focused

---

## 📚 Quick Reference

### Essential Files to Read

**For All Agents:**
1. `.ai/CLAUDE.md` - Start here!
2. `.ai/WORKFLOWS.md` - Git rules
3. `groupsync/aiDocs/context.md` - Project overview

**For Specific Tasks:**
- Building APIs? → `aiDocs/api-guide.md`
- Working with database? → `aiDocs/database-schema.md`
- Creating components? → `aiDocs/component-library.md`
- Authentication? → `aiDocs/auth-flow.md`
- Deploying? → `aiDocs/deployment.md`

### Common Commands

```bash
# Development
cd groupsync && npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Build (test production)
npm run build

# Database studio
npx prisma studio

# Verification (spawn agent with .ai/VERIFICATION_AGENT_PROMPT.md)
```

---

## 🔧 Customization

### Adding a New AI Tool

1. Create tool-specific config file (e.g., `.geminirc`)
2. Reference `.ai/CLAUDE.md` in the config
3. Add tool-specific tips if needed
4. Add to `.gitignore` if it's personal

### Updating Team Standards

1. Edit files in `groupsync/aiDocs/`
2. Commit changes to git
3. All agents will see updated docs on next read

### Adding Project-Specific Rules

Edit `.ai/CLAUDE.md` to add rules that apply across all tools.

---

## 🎓 Training Your Team

**For team members using AI tools:**

1. Share this document with them
2. Point their AI tool to `.ai/CLAUDE.md`
3. Explain the two-folder pattern:
   - `aiDocs/` = shared (commit it)
   - `ai/` = personal (gitignored)

**For onboarding new AI agents:**

```
Hi! Welcome to the GroupSync project.

Before you start, please read these files in order:
1. .ai/CLAUDE.md (master instructions)
2. .ai/WORKFLOWS.md (git workflows)
3. groupsync/aiDocs/context.md (project overview)

These contain all the rules and context you need to work on this project effectively.
```

---

## 🚨 Important Reminders

### DO:
- ✅ Read `.ai/CLAUDE.md` before starting
- ✅ Run all pre-commit checks
- ✅ Spawn verification agent before committing
- ✅ Update `aiDocs/` when you change architecture
- ✅ Ask user before complex architectural changes

### DON'T:
- ❌ Skip pre-commit verification
- ❌ Use `git add .` or `git add -A`
- ❌ Force push without explicit permission
- ❌ Commit without proper message format
- ❌ Over-engineer solutions
- ❌ Guess when uncertain - ask instead

---

## 📞 Support

**Questions about this system?**
- Check `.ai/CLAUDE.md` for guidelines
- Check `.ai/WORKFLOWS.md` for git rules
- Check `groupsync/aiDocs/` for technical docs

**Need to modify the system?**
- Universal rules: Edit `.ai/CLAUDE.md`
- Git workflows: Edit `.ai/WORKFLOWS.md`
- Project docs: Edit `groupsync/aiDocs/`
- Tool configs: Edit `.cursorrules`, `.github/copilot-instructions.md`, etc.

---

## 🎉 You're All Set!

Your AI orchestration system is ready. Your team can now:
- Use different AI tools (Cursor, Claude, Gemini, Codex) with consistent rules
- Maintain code quality through strict pre-commit checks
- Keep documentation organized and up-to-date
- Collaborate effectively without chaos

**Next Steps:**
1. Share this document with your team
2. Point each team member's AI tool to `.ai/CLAUDE.md`
3. Start building!

Happy coding! 🚀

---

**System Created By:** Claude Sonnet 4.5
**Date:** 2026-02-14
**Maintained By:** GroupSync Team
