GroupSync: Claude Code & Cursor Buildout Guide
Aligned with Hackathon Evaluation Criteria

📋 EVALUATION CRITERIA MAPPING
Your build needs to demonstrate excellence in these 5 areas:
Criteria
What Judges Want
How We'll Demonstrate
1. Problem Definition & User Understanding
Evidence you talked to real students, identified specific pain points
Survey data (31 responses), user quotes in UI, persona-driven design
2. Design & UX Quality
Clean, intuitive, professional interface
Modern UI with Tailwind/shadcn, mobile-responsive, clear user flows
3. Technical Considerations & Use of AI
Smart use of AI in building AND in the product itself
Claude Code for development, AI task suggestions in product
4. Creativity in Solution
Novel approach, not just copying existing tools
Unique "expectation contract" feature, AI-powered project kickoff
5. Presentation & Communication
Clear story, concise demo
Demo-ready states, shareable invite flow


🛠️ DEVELOPMENT ENVIRONMENT SETUP
Prerequisites
# Install Node.js 18+ (if not installed)
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

Project Initialization
# Create project directory
mkdir groupsync && cd groupsync

# Initialize with Claude Code
claude init

# Or if using Cursor, open folder and use Cmd+K / Ctrl+K for AI

Recommended Stack
Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
Backend: Supabase (Auth + Database + Realtime)
AI: OpenAI API (for task suggestions) - optional
Deployment: Vercel


🎯 PHASE 0: PROJECT SCAFFOLD (30 min)
Claude Code Prompt
Create a Next.js 14 project with App Router for a student collaboration app called "GroupSync".

Setup:
- TypeScript
- Tailwind CSS
- shadcn/ui components (button, card, input, dialog, tabs, avatar, badge, dropdown-menu, form, toast)
- Supabase client library
- Lucide React icons

Project structure:
/app
  /page.tsx (landing page)
  /(auth)
    /login/page.tsx
    /signup/page.tsx
  /(dashboard)
    /dashboard/page.tsx
    /project/[id]/page.tsx
    /join/[code]/page.tsx
/components
  /ui (shadcn components)
  /landing
  /auth
  /dashboard
  /project
/lib
  supabase.ts
  utils.ts
/types
  index.ts

Environment variables needed:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY (optional)

Create the folder structure and install all dependencies.

Cursor Alternative
In Cursor, press Cmd+K and paste the same prompt. Cursor will generate the files.
Verify Setup
npm run dev
# Should see Next.js app at localhost:3000


🎯 PHASE 1: DATABASE & AUTH (1-2 hours)
Step 1.1: Supabase Setup
Go to supabase.com → New Project
Save your project URL and anon key
Create .env.local:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

Step 1.2: Database Schema
Claude Code Prompt:
Create a Supabase SQL migration file for GroupSync with these tables:

1. profiles (extends auth.users)
   - id: uuid (references auth.users.id)
   - name: text
   - avatar_url: text (nullable)
   - created_at: timestamptz (default now())

2. projects
   - id: uuid (primary key, default gen_random_uuid())
   - name: text (not null)
   - description: text
   - deadline: date
   - created_by: uuid (references profiles.id)
   - invite_code: text (unique, 6 characters, auto-generate)
   - created_at: timestamptz (default now())

3. project_members
   - id: uuid (primary key)
   - project_id: uuid (references projects.id on delete cascade)
   - user_id: uuid (references profiles.id)
   - role: text ('owner' or 'member')
   - joined_at: timestamptz (default now())
   - unique constraint on (project_id, user_id)

4. availability
   - id: uuid (primary key)
   - project_id: uuid (references projects.id on delete cascade)
   - user_id: uuid (references profiles.id)
   - slots: jsonb (array of {day: 0-6, start: "HH:MM", end: "HH:MM"})
   - updated_at: timestamptz (default now())

5. tasks
   - id: uuid (primary key)
   - project_id: uuid (references projects.id on delete cascade)
   - title: text (not null)
   - description: text
   - assigned_to: uuid (references profiles.id, nullable)
   - status: text ('todo', 'in_progress', 'done') default 'todo'
   - due_date: date (nullable)
   - order_index: integer (for sorting)
   - created_at: timestamptz (default now())

6. team_agreements
   - id: uuid (primary key)
   - project_id: uuid (references projects.id, unique)
   - response_time_hours: integer (default 24)
   - meeting_frequency: text
   - communication_channel: text
   - quality_standards: text
   - agreed_by: uuid[] (array of user_ids who agreed)
   - updated_at: timestamptz (default now())

Include RLS policies:
- Users can only see/edit projects they're members of
- Users can only see/edit their own availability
- Users can only modify tasks in their projects
- Project owners can modify team_agreements

Also create a function to auto-generate invite codes and a trigger for new profiles.

Step 1.3: Run Migration
Copy the SQL output to Supabase SQL Editor and run it.
Step 1.4: Auth Components
Claude Code Prompt:
Create authentication components for GroupSync using Supabase Auth:

1. /lib/supabase.ts - Supabase client setup for client and server components

2. /components/auth/LoginForm.tsx
   - Email/password login
   - "Sign up" link
   - Error handling with toast notifications
   - Redirect to /dashboard on success

3. /components/auth/SignupForm.tsx
   - Name, email, password fields
   - Password confirmation
   - Creates profile after signup
   - Redirect to /dashboard on success

4. /app/(auth)/login/page.tsx - Login page with LoginForm
5. /app/(auth)/signup/page.tsx - Signup page with SignupForm

6. /components/auth/AuthProvider.tsx - Context provider for auth state

7. Middleware to protect /dashboard and /project routes

Design: Clean, centered card layout. Use shadcn form components.

✅ Phase 1 Checklist (Rubric Alignment)
[ ] Database schema created in Supabase
[ ] RLS policies working (test in Supabase dashboard)
[ ] User can sign up → profile created
[ ] User can log in → redirected to dashboard
[ ] Protected routes redirect to login
[ ] RUBRIC: Technical Considerations ✓ (proper auth, database design)

🎯 PHASE 2: LANDING PAGE (1 hour)
Why This Matters for Rubric
Problem Definition: Landing page should clearly state the problem
Design & UX: First impression matters
Presentation: Judges will see this first
Claude Code Prompt:
Create a compelling landing page for GroupSync at /app/page.tsx

Content structure:
1. Hero Section
   - Headline: "Stop fighting schedules. Start building together."
   - Subheadline: "GroupSync helps student teams align schedules, set expectations, and track progress — in under 2 minutes."
   - CTA buttons: "Get Started Free" → /signup, "Join a Project" → /join
   - Show a mockup/illustration of the app (use a placeholder div for now)

2. Problem Section
   - Title: "Group projects shouldn't be this hard"
   - 3 pain point cards with icons:
     - "39% say scheduling is their biggest frustration"
     - "68% would use a tool that makes collaboration smoother"
     - "Students waste hours coordinating instead of creating"
   - These stats come from our actual survey data

3. Solution Section
   - Title: "Everything your team needs in one place"
   - 4 feature cards:
     - Smart Scheduling: "Find times that work for everyone"
     - Task Clarity: "Know who's doing what and when"
     - Team Agreements: "Set expectations upfront"
     - AI-Powered: "Get task suggestions tailored to your project"

4. How It Works Section
   - 3 step process with numbers:
     1. Create your project (30 seconds)
     2. Invite your team (share a link)
     3. Align and build (set availability, tasks, expectations)

5. CTA Section
   - "Ready to make group work actually work?"
   - Large "Create Your First Project" button

Design requirements:
- Modern, clean, lots of whitespace
- Color scheme: Blue primary (#2563EB), green accents (#10B981)
- Responsive (mobile-first)
- Smooth scroll animations (optional)
- No generic stock photos - use icons and illustrations

✅ Phase 2 Checklist
[ ] Landing page loads correctly
[ ] Mobile responsive
[ ] Stats from survey data visible (shows user research)
[ ] Clear value proposition
[ ] CTAs link to auth pages
[ ] RUBRIC: Problem Definition ✓ (survey stats shown)
[ ] RUBRIC: Design & UX ✓ (professional landing page)

🎯 PHASE 3: DASHBOARD & PROJECT CREATION (2-3 hours)
Step 3.1: Dashboard
Claude Code Prompt:
Create the main dashboard at /app/(dashboard)/dashboard/page.tsx

Features:
1. Header with user avatar and logout
2. "Your Projects" section showing project cards
3. Each project card shows:
   - Project name
   - Deadline (with "X days left" badge if soon)
   - Number of members
   - Progress indicator (tasks done / total tasks)
   - Click to go to /project/[id]
4. Empty state: "No projects yet. Create your first project or join one."
5. Two action buttons:
   - "Create Project" (opens modal/wizard)
   - "Join Project" (opens modal for invite code input)

Create these components:
- /components/dashboard/ProjectCard.tsx
- /components/dashboard/ProjectList.tsx
- /components/dashboard/EmptyState.tsx
- /components/dashboard/CreateProjectModal.tsx
- /components/dashboard/JoinProjectModal.tsx

Data fetching:
- Server component that fetches user's projects from Supabase
- Include member count and task stats in query

Step 3.2: Create Project Wizard
Claude Code Prompt:
Create a multi-step project creation wizard in /components/dashboard/CreateProjectWizard.tsx

Step 1: Basic Info
- Project name (required, text input)
- Description (optional, textarea)
- Deadline (required, date picker)
- "Next" button

Step 2: Quick Setup (optional but encouraged)
- Response time expectation (dropdown: 1 hour, 4 hours, 24 hours, 48 hours)
- Meeting frequency (dropdown: daily, twice a week, weekly, as needed)
- Preferred communication (dropdown: iMessage, Discord, Slack, GroupMe, Other + text input)
- "Skip" and "Next" buttons

Step 3: Invite Team
- Show generated invite link prominently
- "Copy Link" button with success toast
- Option to enter teammate emails (store for later, don't send yet)
- "Done - Go to Project" button

Technical:
- Use React state for wizard steps
- On completion: create project in Supabase, create team_agreement, add user as owner
- Generate 6-character invite code (alphanumeric, uppercase)
- Redirect to /project/[id] on completion

UI:
- Progress indicator showing current step (1, 2, 3)
- Smooth transitions between steps
- Mobile-friendly

Step 3.3: Join Project Flow
Claude Code Prompt:
Create the join project flow:

1. /app/(dashboard)/join/[code]/page.tsx
   - Dynamic route that accepts invite code
   - If not logged in: show project preview + prompt to login/signup
   - If logged in: show project name, creator, member count
   - "Join This Project" button
   - On join: add to project_members, redirect to project

2. /components/dashboard/JoinProjectModal.tsx
   - Simple modal with invite code input
   - "Join" button
   - Validates code exists
   - If valid: redirects to /join/[code] page

Handle edge cases:
- Invalid code: "This invite code doesn't exist"
- Already a member: "You're already in this project" → redirect
- Code format validation (6 chars, alphanumeric)

✅ Phase 3 Checklist
[ ] Dashboard shows user's projects
[ ] Empty state displays correctly
[ ] Create project wizard works (all 3 steps)
[ ] Invite code generated and copyable
[ ] Join via code works
[ ] New project appears in dashboard
[ ] RUBRIC: Design & UX ✓ (intuitive flows)
[ ] RUBRIC: Creativity ✓ (quick setup for expectations)

🎯 PHASE 4: PROJECT VIEW - CORE FEATURES (3-4 hours)
Step 4.1: Project Layout
Claude Code Prompt:
Create the project view at /app/(dashboard)/project/[id]/page.tsx

Layout:
- Project header: name, deadline badge, invite button, settings dropdown
- Tab navigation: Overview | Tasks | Availability | Team
- Content area below tabs

Create:
- /components/project/ProjectHeader.tsx
- /components/project/ProjectTabs.tsx
- Fetch project data, members, tasks on server side
- Pass to client components

The Overview tab should show:
- Team Agreement card (editable by owner)
- Next meeting time (if scheduled)
- Quick stats: X tasks done, Y in progress, Z team members
- Recent activity (optional, v2)

Step 4.2: Availability Feature (CRITICAL - Top Pain Point)
Claude Code Prompt:
Create the availability scheduling feature:

1. /components/project/AvailabilityTab.tsx
   Main container that shows:
   - "Your Availability" section with grid input
   - "Team Availability" section with overlap visualization
   - "Find Meeting Time" button and results

2. /components/project/AvailabilityGrid.tsx
   Weekly grid for inputting availability:
   - Columns: Mon, Tue, Wed, Thu, Fri, Sat, Sun
   - Rows: Time slots from 8 AM to 10 PM (30-min increments)
   - Click to toggle available (green) / unavailable (gray)
   - Drag to select multiple slots
   - "Save" button that stores to Supabase
   - Mobile: Show as list view with time range pickers

3. /components/project/TeamAvailability.tsx
   Visualization of overlapping times:
   - Same grid layout but read-only
   - Color intensity shows how many people are free
   - Hover shows who's available
   - Legend: "All free" (dark green), "Most free" (medium), "Some free" (light)

4. /components/project/MeetingFinder.tsx
   Algorithm to find best meeting times:
   - Find all slots where everyone is free
   - Rank by: duration (longer = better), time of day (afternoon preferred)
   - Display top 5 suggestions as cards
   - Each card shows: day, time range, duration
   - "Schedule This" button (owner only) - saves to project
   - Handle edge case: no overlap → show partial matches with who's missing

Store availability as JSONB:
[
  { "day": 1, "start": "09:00", "end": "12:00" },
  { "day": 1, "start": "14:00", "end": "17:00" },
  ...
]

Step 4.3: Task Management
Claude Code Prompt:
Create task management feature:

1. /components/project/TasksTab.tsx
   - Toggle between Kanban and List view
   - "Add Task" button
   - Optional: "Suggest Tasks with AI" button

2. /components/project/TaskBoard.tsx (Kanban view)
   Three columns: To Do | In Progress | Done
   - Use @dnd-kit/core for drag and drop
   - Each column is droppable
   - Tasks are draggable cards
   - On drop: update task status in Supabase

3. /components/project/TaskCard.tsx
   Card showing:
   - Task title
   - Assigned to (avatar or "Unassigned" badge)
   - Due date (if set, show "Due in X days" or "Overdue" badge)
   - Click to open TaskDetailModal

4. /components/project/TaskDetailModal.tsx
   Full task editing:
   - Title (editable)
   - Description (textarea)
   - Assigned to (dropdown of project members)
   - Due date (date picker)
   - Status (dropdown)
   - Delete button with confirmation
   - Save changes to Supabase

5. /components/project/TaskListView.tsx (List view - simpler)
   - Grouped by status with headers
   - Each row: checkbox (toggle done), title, assignee avatar, due date
   - Click row to open modal
   - Better for mobile

6. /components/project/AddTaskModal.tsx
   Quick add:
   - Title (required)
   - Description (optional)
   - Assign to (optional)
   - Due date (optional)
   - "Add Task" button

Step 4.4: AI Task Suggestions (Shows AI Use)
Claude Code Prompt:
Create AI-powered task suggestions feature:

1. /app/api/suggest-tasks/route.ts
   API route that:
   - Receives project name, description, deadline
   - Calls OpenAI API (or Claude API) with this prompt:
   
   "You are helping a student team break down a group project into actionable tasks.
   
   Project: {name}
   Description: {description}
   Deadline: {deadline}
   
   Generate 5-7 specific, actionable tasks. For each task provide:
   - title: short task name (under 50 characters)
   - description: one sentence explaining what needs to be done
   - estimatedHours: rough time estimate
   - priority: 'high', 'medium', or 'low'
   
   Focus on typical student project phases: research, drafting, review, finalization.
   Return as JSON array."
   
   - Parse response and return to client

2. /components/project/AISuggestButton.tsx
   - "✨ Suggest Tasks with AI" button
   - Loading state: "Thinking..."
   - On response: show suggestions in a modal

3. /components/project/TaskSuggestionsModal.tsx
   - Display suggested tasks as cards
   - Each card has:
     - Task title and description
     - "Add" button (adds to project tasks)
     - "Skip" button (dismisses)
   - "Add All" button at bottom
   - Track which were added for presentation

Fallback if no API key:
- Show message: "AI suggestions require an OpenAI API key"
- Link to docs on how to add
- Don't break the app

✅ Phase 4 Checklist
[ ] Project page loads with tabs
[ ] Availability grid works (input and save)
[ ] Team availability shows overlaps
[ ] Meeting finder suggests times
[ ] Task board displays correctly
[ ] Drag and drop works (desktop)
[ ] Task CRUD operations work
[ ] AI suggestions work (or graceful fallback)
[ ] RUBRIC: Problem Definition ✓ (scheduling = #1 pain point)
[ ] RUBRIC: Technical & AI ✓ (AI task suggestions)
[ ] RUBRIC: Creativity ✓ (meeting finder algorithm)

🎯 PHASE 5: TEAM AGREEMENT FEATURE (1-2 hours)
Why This Matters
This is your differentiator. Survey showed students want "expectations set upfront" - existing tools don't do this.
Claude Code Prompt:
Create the Team Agreement feature:

1. /components/project/TeamTab.tsx
   Shows:
   - Team members list with avatars, names, roles (owner/member)
   - Team Agreement section
   - Invite link (for adding more members)

2. /components/project/TeamAgreement.tsx
   Card that displays current agreement:
   - Response time: "Respond within X hours"
   - Meeting frequency: "Meet Y"
   - Communication: "Communicate via Z"
   - Quality standards: custom text
   
   Shows agreement status:
   - List of members with checkmarks for who agreed
   - "X of Y members agreed" badge
   - If all agreed: "Team Aligned ✓" green badge
   
   Owner can click "Edit" to modify
   Members see "I Agree" button if they haven't agreed

3. /components/project/TeamAgreementEditor.tsx
   Modal for owner to edit:
   - Response time dropdown
   - Meeting frequency dropdown
   - Communication channel dropdown + custom input
   - Quality standards textarea (e.g., "Review each other's work before submitting")
   - "Save Changes" button
   - Note: "Team members will need to re-agree after changes"

4. Agreement logic:
   - When agreement is updated, clear agreed_by array
   - Each member clicks "I Agree" to add their ID to array
   - Show visual progress toward full alignment
   
This feature demonstrates:
- Understanding of the "expectations" pain point from survey
- Creative solution not found in existing tools
- Builds accountability without being heavy-handed

✅ Phase 5 Checklist
[ ] Team members list displays correctly
[ ] Team agreement shows current settings
[ ] Owner can edit agreement
[ ] Members can agree
[ ] Agreement status updates in real-time
[ ] RUBRIC: Creativity ✓ (unique feature)
[ ] RUBRIC: Problem Definition ✓ (addresses expectations pain)

🎯 PHASE 6: POLISH & DEMO PREP (2-3 hours)
Step 6.1: Empty States & Onboarding
Claude Code Prompt:
Add helpful empty states and micro-interactions:

1. Empty states for:
   - No projects: Illustration + "Create your first project" CTA
   - No tasks: "Add your first task or let AI suggest some"
   - No availability submitted: "Add your availability so your team can find meeting times"
   - No team agreement: "Set expectations for your team" (owner) / "Waiting for owner to set expectations" (member)

2. Loading states:
   - Skeleton loaders for project cards
   - Spinner for AI suggestions
   - Optimistic updates for task status changes

3. Success feedback:
   - Toast: "Project created!"
   - Toast: "Invite link copied!"
   - Toast: "Availability saved"
   - Toast: "Task added"
   - Confetti or animation when team fully aligned (optional)

4. Error handling:
   - Network error: "Something went wrong. Please try again."
   - Form validation errors inline
   - 404 for invalid project IDs

Step 6.2: Mobile Optimization
Claude Code Prompt:
Ensure mobile responsiveness:

1. Navigation:
   - Mobile: Bottom tab bar or hamburger menu
   - Project tabs: Horizontal scroll or dropdown on mobile

2. Availability grid:
   - Mobile: Stack days vertically or use list view
   - Touch-friendly slot selection

3. Task board:
   - Mobile: Stack columns or swipe between them
   - Larger touch targets for drag handles

4. Modals:
   - Mobile: Full-screen sheets instead of centered modals
   - Bottom sheet pattern for quick actions

5. Typography:
   - Minimum 16px for body text (prevents zoom on iOS)
   - Larger tap targets (44px minimum)

Test on mobile viewport (375px width) and fix any issues.

Step 6.3: Demo-Ready State
Claude Code Prompt:
Create seed data and demo setup:

1. /scripts/seed-demo.ts
   Script that creates demo data:
   - Demo project: "CS 401 Final Project"
   - 4 team members with realistic names
   - Pre-filled availability (some overlap, some conflict)
   - 6 tasks in various states
   - Team agreement set, 3 of 4 agreed
   
   This lets you demo without creating everything manually.

2. Add demo banner:
   - If project ID matches demo project, show subtle banner
   - "This is a demo project" with link to create real one

3. Prepare demo flow:
   - Landing page → Sign up → Dashboard (with demo project)
   - Show project overview
   - Show availability + meeting finder
   - Show task board with drag
   - Show team agreement
   - Show invite flow (copy link, paste in new tab)

✅ Phase 6 Checklist
[ ] All empty states have helpful content
[ ] Loading states prevent layout shift
[ ] Works on mobile (test on actual phone)
[ ] Demo data created
[ ] Full flow tested end-to-end
[ ] No console errors
[ ] RUBRIC: Design & UX ✓ (polished experience)

🎯 PHASE 7: DEPLOYMENT (30 min)
Vercel Deployment
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# OPENAI_API_KEY (if using AI features)

# Get production URL for submission

Pre-Submission Checklist
[ ] App loads on production URL
[ ] Auth works in production
[ ] Database connected (check Supabase connection)
[ ] All features functional
[ ] Mobile responsive
[ ] Shareable invite links work
[ ] Record backup demo video (just in case)

📊 RUBRIC ALIGNMENT SUMMARY
Criteria
Evidence in Your Build
Problem Definition & User Understanding
Survey stats on landing page (39%, 68%), persona-driven features (scheduling, expectations), user quotes inform design
Design & UX Quality
Modern UI with shadcn, mobile-responsive, clear flows, helpful empty states, loading feedback
Technical Considerations & Use of AI
Claude Code/Cursor for development (document this!), AI task suggestions feature, proper database design, real-time updates
Creativity in Solution
Team Agreement feature (unique!), expectation contract, meeting finder algorithm, not just copying When2Meet or Trello
Presentation & Communication
Demo-ready states, clean invite flow to show in presentation, clear value prop on landing page


🚀 QUICK REFERENCE: CLAUDE CODE COMMANDS
# Start a new conversation about a file
claude "explain this file" path/to/file.tsx

# Generate a component
claude "create a React component that..."

# Fix an error
claude "I'm getting this error: [paste error]. Fix it."

# Refactor
claude "refactor this to use..."

# Add a feature
claude "add X feature to this component"

# In Cursor: Cmd+K for inline edits, Cmd+L for chat


⏱️ TIME BUDGET
Phase
Hours
Priority
0. Scaffold
0.5
MUST
1. Database & Auth
1.5
MUST
2. Landing Page
1
MUST
3. Dashboard & Create
2.5
MUST
4. Project Features
4
MUST
5. Team Agreement
1.5
SHOULD
6. Polish
2
SHOULD
7. Deployment
0.5
MUST
TOTAL
13.5



Buffer: 6.5 hours for bugs, iteration, presentation prep

🎤 WHAT TO SAY ABOUT YOUR PROCESS
For the presentation, document HOW you used AI:
Survey Analysis: "We used Claude to analyze 31 survey responses and identify that scheduling (39%) was the #1 pain point"


Architecture: "We used Claude Code to scaffold our Next.js project and design our database schema"


Component Development: "We pair-programmed with Claude/Cursor to build our availability algorithm and task management system"


In-Product AI: "Our product uses AI to suggest task breakdowns based on project type, saving students time on project planning"


Iteration: "When user testing revealed X, we used Claude to quickly refactor Y"


This shows judges you used AI as a "multiplier for product thinking" - exactly what the hackathon wants.

Good luck! Start with Phase 0 and work through systematically. 🚀

