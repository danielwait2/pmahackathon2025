# GroupSync Database Schema

> **Reference for the Prisma database schema.** Use this when working with data models.

---

## 🗄️ Database Overview

- **Provider:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma 5.22
- **Location:** `prisma/schema.prisma`
- **Client:** `lib/db.ts` (singleton instance)

---

## 📊 Entity Relationship Diagram

```
User (authenticated users)
  ├─ 1:N → Project (as creator)
  ├─ 1:N → ProjectMember (as member)
  ├─ 1:N → Availability
  ├─ 1:N → Task (as assignee)
  └─ 1:N → Meeting (as creator)

Project
  ├─ N:1 → User (creator)
  ├─ N:1 → Class (optional)
  ├─ 1:N → ProjectMember
  ├─ 1:N → Availability
  ├─ 1:N → Task
  ├─ 1:1 → TeamAgreement
  └─ 1:N → Meeting

ProjectMember (join table)
  ├─ N:1 → Project
  ├─ N:1 → User (optional, for guests)
  └─ 1:N → Availability (for guests)

Class (shared across projects)
  └─ 1:N → Project
```

---

## 📋 Models Reference

### User
**Table:** `users`

Authenticated users who can create and join projects.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `email` | String (unique) | Login email |
| `name` | String | Display name |
| `password` | String | Hashed password (bcrypt) |
| `avatarUrl` | String? | Profile picture URL (optional) |
| `createdAt` | DateTime | Account creation timestamp |

**Relations:**
- `createdProjects` - Projects this user created
- `projectMembers` - Project memberships
- `availability` - Availability slots for projects
- `assignedTasks` - Tasks assigned to this user
- `createdMeetings` - Meetings this user created

**Usage:**
```typescript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// Get user with their projects
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    projectMembers: {
      include: { project: true }
    }
  }
});
```

---

### Project
**Table:** `projects`

Group projects that users collaborate on.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String | Project name |
| `description` | String? | Project description (optional) |
| `deadline` | DateTime? | Project deadline (optional) |
| `classId` | String? | Associated class ID (optional) |
| `isAssignment` | Boolean | Is this a class assignment? (default: false) |
| `createdById` | String | Creator user ID |
| `inviteCode` | String (unique) | 6-character invite code |
| `shareToken` | String? (unique) | Public sharing token (optional) |
| `createdAt` | DateTime | Creation timestamp |

**Relations:**
- `createdBy` - User who created the project
- `class` - Associated class (if any)
- `members` - ProjectMember records
- `availability` - Team availability slots
- `tasks` - Project tasks
- `teamAgreement` - Team expectations (1:1)
- `meetings` - Scheduled meetings

**Usage:**
```typescript
// Create new project
const project = await prisma.project.create({
  data: {
    name: 'CS 401 Final Project',
    description: 'Build a web app',
    deadline: new Date('2026-05-15'),
    createdById: userId,
    inviteCode: generateInviteCode(), // 6 chars
    members: {
      create: {
        userId: userId,
        role: 'owner'
      }
    }
  }
});

// Get project with all details
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    class: true,
    members: {
      include: { user: true }
    },
    tasks: true,
    teamAgreement: true,
    meetings: {
      orderBy: { date: 'asc' }
    }
  }
});
```

---

### ProjectMember
**Table:** `project_members`

Join table for project membership. Supports both authenticated users and guests.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `projectId` | String | Project ID |
| `userId` | String? | User ID (null for guests) |
| `guestName` | String? | Guest display name |
| `role` | String | 'owner' or 'member' |
| `joinedAt` | DateTime | Join timestamp |

**Unique Constraint:** `(projectId, userId)` - User can only join a project once

**Relations:**
- `project` - The project
- `user` - The user (optional for guests)
- `guestAvailability` - Availability for guest members

**Usage:**
```typescript
// Add member to project
await prisma.projectMember.create({
  data: {
    projectId: projectId,
    userId: userId,
    role: 'member'
  }
});

// Add guest member
await prisma.projectMember.create({
  data: {
    projectId: projectId,
    guestName: 'John Doe',
    role: 'member'
  }
});
```

---

### Availability
**Table:** `availability`

Stores team member availability slots for scheduling.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `projectId` | String | Project ID |
| `userId` | String? | User ID (null for guests) |
| `guestMemberId` | String? | Guest member ID |
| `slots` | String | JSON array of time slots |
| `updatedAt` | DateTime | Last update timestamp |

**Unique Constraints:**
- `(projectId, userId)` - One availability per user per project
- `(projectId, guestMemberId)` - One availability per guest per project

**Slots Format (JSON):**
```json
[
  { "day": 1, "start": "09:00", "end": "12:00" },
  { "day": 1, "start": "14:00", "end": "17:00" },
  { "day": 3, "start": "10:00", "end": "15:00" }
]
```
- `day`: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
- `start`, `end`: HH:mm format (24-hour)

**Usage:**
```typescript
// Save user availability
await prisma.availability.upsert({
  where: {
    projectId_userId: {
      projectId: projectId,
      userId: userId
    }
  },
  create: {
    projectId,
    userId,
    slots: JSON.stringify(slots)
  },
  update: {
    slots: JSON.stringify(slots)
  }
});

// Get all availability for project
const availability = await prisma.availability.findMany({
  where: { projectId },
  include: {
    user: true,
    guestMember: true
  }
});
```

---

### Task
**Table:** `tasks`

Tasks within a project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `projectId` | String | Project ID |
| `title` | String | Task title |
| `description` | String? | Task description (optional) |
| `assignedTo` | String? | Assigned user ID (optional) |
| `status` | String | 'todo', 'in_progress', or 'done' |
| `dueDate` | DateTime? | Task due date (optional) |
| `reminderDate` | DateTime? | Reminder date (optional) |
| `orderIndex` | Int | Sort order (default: 0) |
| `createdAt` | DateTime | Creation timestamp |

**Relations:**
- `project` - The project
- `assignee` - Assigned user (optional)

**Usage:**
```typescript
// Create task
const task = await prisma.task.create({
  data: {
    projectId: projectId,
    title: 'Research competitive analysis',
    description: 'Find 3-5 competitors and analyze features',
    status: 'todo',
    dueDate: new Date('2026-02-20'),
    orderIndex: 0
  }
});

// Update task status
await prisma.task.update({
  where: { id: taskId },
  data: { status: 'in_progress' }
});

// Get project tasks
const tasks = await prisma.task.findMany({
  where: { projectId },
  include: { assignee: true },
  orderBy: { orderIndex: 'asc' }
});
```

---

### TeamAgreement
**Table:** `team_agreements`

Team expectations and norms (1:1 with Project).

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `projectId` | String (unique) | Project ID |
| `responseTimeHours` | Int | Expected response time (default: 24) |
| `meetingFrequency` | String? | Meeting cadence (optional) |
| `communicationChannel` | String? | Preferred channel (optional) |
| `qualityStandards` | String? | Quality expectations (optional) |
| `agreedBy` | String | JSON array of user IDs who agreed |
| `updatedAt` | DateTime | Last update timestamp |

**AgreedBy Format (JSON):**
```json
["user-id-1", "user-id-2", "user-id-3"]
```

**Usage:**
```typescript
// Create team agreement
await prisma.teamAgreement.create({
  data: {
    projectId: projectId,
    responseTimeHours: 24,
    meetingFrequency: 'Twice a week',
    communicationChannel: 'Discord',
    qualityStandards: 'Review each other\'s work before submitting',
    agreedBy: JSON.stringify([userId])
  }
});

// User agrees to agreement
const agreement = await prisma.teamAgreement.findUnique({
  where: { projectId }
});
const agreedBy = JSON.parse(agreement.agreedBy);
if (!agreedBy.includes(userId)) {
  agreedBy.push(userId);
  await prisma.teamAgreement.update({
    where: { projectId },
    data: { agreedBy: JSON.stringify(agreedBy) }
  });
}
```

---

### Meeting
**Table:** `meetings`

Scheduled meetings for a project.

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `projectId` | String | Project ID |
| `title` | String | Meeting title |
| `date` | String | Meeting date (YYYY-MM-DD) |
| `startTime` | String | Start time (HH:mm) |
| `endTime` | String | End time (HH:mm) |
| `createdById` | String? | Creator user ID (optional) |
| `createdAt` | DateTime | Creation timestamp |

**Relations:**
- `project` - The project
- `createdBy` - User who created the meeting

**Usage:**
```typescript
// Schedule meeting
const meeting = await prisma.meeting.create({
  data: {
    projectId: projectId,
    title: 'Sprint Planning',
    date: '2026-02-15',
    startTime: '14:00',
    endTime: '15:00',
    createdById: userId
  }
});

// Get upcoming meetings
const now = new Date();
const meetings = await prisma.meeting.findMany({
  where: {
    projectId,
    date: { gte: now.toISOString().split('T')[0] }
  },
  orderBy: [
    { date: 'asc' },
    { startTime: 'asc' }
  ]
});
```

---

### Class
**Table:** `classes`

Shared list of classes/courses (e.g., "CS 401", "Marketing 101").

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (UUID) | Primary key |
| `name` | String (unique) | Class name (normalized lowercase) |
| `createdAt` | DateTime | Creation timestamp |

**Relations:**
- `projects` - Projects associated with this class

**Normalization:**
- Stored as lowercase, trimmed, collapsed spaces
- Display with proper casing in UI

**Usage:**
```typescript
// Create or find class
const className = 'CS 401'.toLowerCase().trim();
const cls = await prisma.class.upsert({
  where: { name: className },
  create: { name: className },
  update: {}
});

// Get all classes
const classes = await prisma.class.findMany({
  orderBy: { name: 'asc' }
});
```

---

## 🔒 Data Access Patterns

### Permission Checking

**Always verify user permissions before queries:**

```typescript
// Check if user is project member
const member = await prisma.projectMember.findFirst({
  where: {
    projectId: projectId,
    userId: userId
  }
});

if (!member) {
  throw new Error('Not authorized');
}
```

### Efficient Queries

**Use `include` for related data:**
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  include: {
    members: {
      include: { user: true }
    },
    tasks: {
      include: { assignee: true }
    }
  }
});
```

**Use `select` to limit fields:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});
```

### Transactions

**For multi-step operations:**
```typescript
await prisma.$transaction([
  prisma.project.create({ data: projectData }),
  prisma.projectMember.create({ data: memberData }),
  prisma.teamAgreement.create({ data: agreementData })
]);
```

---

## 🛠️ Common Operations

### Create Project with Member
```typescript
const project = await prisma.project.create({
  data: {
    name: 'New Project',
    createdById: userId,
    inviteCode: generateCode(),
    members: {
      create: {
        userId: userId,
        role: 'owner'
      }
    }
  },
  include: { members: true }
});
```

### Join Project via Invite Code
```typescript
const project = await prisma.project.findUnique({
  where: { inviteCode: code }
});

if (project) {
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: userId,
      role: 'member'
    }
  });
}
```

### Get User's Projects
```typescript
const memberships = await prisma.projectMember.findMany({
  where: { userId },
  include: {
    project: {
      include: {
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    }
  }
});

const projects = memberships.map(m => m.project);
```

---

## 📝 Schema Maintenance

**Migration Commands:**
```bash
# Create migration after schema changes
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client after schema changes
npx prisma generate

# Push schema changes without migration (development only)
npx prisma db push
```

**View Database:**
```bash
# Open Prisma Studio
npx prisma studio
```

---

**Schema Location:** `prisma/schema.prisma`
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
