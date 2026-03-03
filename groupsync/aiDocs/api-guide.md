# GroupSync API Reference

> **API routes documentation.** Use this when creating or modifying API endpoints.

---

## 📍 Base URL

- **Development:** `http://localhost:3000/api`
- **Production:** `https://[your-vercel-url]/api`

---

## 🔐 Authentication

All API routes that require authentication should:
1. Get session from NextAuth: `await getServerSession(authOptions)`
2. Check if session exists and has user
3. Return 401 if unauthorized

**Example:**
```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Proceed with authenticated request
}
```

---

## 📋 API Endpoints

### Auth

#### `POST /api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "john@example.com",
  "name": "John Doe"
}
```

**Errors:**
- `400` - Email already exists
- `400` - Invalid input (validation errors)

---

### Projects

#### `GET /api/projects`
Get all projects for the authenticated user.

**Auth:** Required

**Response (200):**
```json
[
  {
    "id": "project-uuid",
    "name": "CS 401 Final Project",
    "description": "Build a web app",
    "deadline": "2026-05-15T00:00:00.000Z",
    "classId": "class-uuid",
    "className": "cs 401",
    "memberCount": 4,
    "taskCount": 12,
    "completedTaskCount": 5
  }
]
```

#### `POST /api/projects`
Create a new project.

**Auth:** Required

**Request:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "deadline": "2026-05-15",
  "classId": "class-uuid"
}
```

**Response (201):**
```json
{
  "id": "project-uuid",
  "name": "New Project",
  "inviteCode": "ABC123",
  "createdAt": "2026-02-14T..."
}
```

#### `GET /api/projects/[id]`
Get a specific project.

**Auth:** Required (must be project member)

**Response (200):**
```json
{
  "id": "project-uuid",
  "name": "Project Name",
  "description": "...",
  "members": [...],
  "tasks": [...],
  "meetings": [...]
}
```

#### `PUT /api/projects/[id]`
Update a project.

**Auth:** Required (must be project owner)

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### `DELETE /api/projects/[id]`
Delete a project.

**Auth:** Required (must be project owner)

**Response (200):**
```json
{
  "message": "Project deleted"
}
```

---

### Tasks

#### `GET /api/tasks?projectId=xxx`
Get all tasks for a project.

**Auth:** Required (must be project member)

**Query Params:**
- `projectId` (required) - Project UUID

**Response (200):**
```json
[
  {
    "id": "task-uuid",
    "title": "Research competitors",
    "description": "...",
    "status": "in_progress",
    "assignedTo": "user-uuid",
    "assignee": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "dueDate": "2026-02-20",
    "reminderDate": "2026-02-19"
  }
]
```

#### `POST /api/tasks`
Create a new task.

**Auth:** Required (must be project member)

**Request:**
```json
{
  "projectId": "project-uuid",
  "title": "Task title",
  "description": "Task description",
  "assignedTo": "user-uuid",
  "dueDate": "2026-02-20",
  "status": "todo"
}
```

**Response (201):**
```json
{
  "id": "task-uuid",
  "title": "Task title",
  "status": "todo",
  "createdAt": "..."
}
```

#### `PUT /api/tasks/[id]`
Update a task.

**Auth:** Required (must be project member)

**Request:**
```json
{
  "title": "Updated title",
  "status": "done",
  "assignedTo": "user-uuid"
}
```

#### `DELETE /api/tasks/[id]`
Delete a task.

**Auth:** Required (must be project member)

---

### Availability

#### `GET /api/availability?projectId=xxx`
Get all availability for a project.

**Auth:** Optional (public for share links)

**Query Params:**
- `projectId` (required) - Project UUID

**Response (200):**
```json
[
  {
    "id": "availability-uuid",
    "userId": "user-uuid",
    "userName": "John Doe",
    "slots": [
      { "day": 1, "start": "09:00", "end": "12:00" },
      { "day": 3, "start": "14:00", "end": "17:00" }
    ]
  }
]
```

#### `POST /api/availability`
Create or update availability.

**Auth:** Optional (guests can submit via guestMemberId)

**Request:**
```json
{
  "projectId": "project-uuid",
  "userId": "user-uuid",
  "guestMemberId": "guest-member-uuid",
  "slots": [
    { "day": 1, "start": "09:00", "end": "12:00" }
  ]
}
```

---

### Meetings

#### `GET /api/meetings?projectId=xxx`
Get all meetings for a project.

**Auth:** Required (must be project member)

**Response (200):**
```json
[
  {
    "id": "meeting-uuid",
    "title": "Sprint Planning",
    "date": "2026-02-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "createdBy": {
      "name": "John Doe"
    }
  }
]
```

#### `POST /api/meetings`
Create a new meeting.

**Auth:** Required (must be project member)

**Request:**
```json
{
  "projectId": "project-uuid",
  "title": "Sprint Planning",
  "date": "2026-02-15",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

#### `DELETE /api/meetings/[id]`
Delete a meeting.

**Auth:** Required (must be creator or project owner)

---

### Classes

#### `GET /api/classes`
Get all classes (courses).

**Auth:** Optional

**Response (200):**
```json
[
  {
    "id": "class-uuid",
    "name": "cs 401",
    "displayName": "CS 401"
  }
]
```

#### `POST /api/classes`
Create a new class.

**Auth:** Required

**Request:**
```json
{
  "name": "CS 401"
}
```

**Response (201):**
```json
{
  "id": "class-uuid",
  "name": "cs 401"
}
```

**Note:** Class names are normalized (lowercase, trimmed) to prevent duplicates.

---

### Team Agreements

#### `GET /api/team-agreement?projectId=xxx`
Get team agreement for a project.

**Auth:** Required (must be project member)

**Response (200):**
```json
{
  "id": "agreement-uuid",
  "projectId": "project-uuid",
  "responseTimeHours": 24,
  "meetingFrequency": "Twice a week",
  "communicationChannel": "Discord",
  "qualityStandards": "Review each other's work",
  "agreedBy": ["user-id-1", "user-id-2"]
}
```

#### `POST /api/team-agreement`
Create or update team agreement.

**Auth:** Required (must be project owner)

**Request:**
```json
{
  "projectId": "project-uuid",
  "responseTimeHours": 24,
  "meetingFrequency": "Daily",
  "communicationChannel": "Slack"
}
```

#### `POST /api/team-agreement/agree`
User agrees to team agreement.

**Auth:** Required (must be project member)

**Request:**
```json
{
  "projectId": "project-uuid"
}
```

---

## 🔧 API Development Guidelines

### Error Handling

**Always return proper HTTP status codes:**
- `200` - OK (successful GET, PUT, DELETE)
- `201` - Created (successful POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid auth)
- `403` - Forbidden (authenticated but not allowed)
- `404` - Not Found
- `500` - Internal Server Error

**Error Response Format:**
```json
{
  "error": "Human-readable error message"
}
```

### Input Validation

**Always validate inputs:**
```typescript
if (!data.name || data.name.trim() === '') {
  return Response.json(
    { error: 'Name is required' },
    { status: 400 }
  );
}
```

### Permission Checks

**Always verify user has access:**
```typescript
const member = await prisma.projectMember.findFirst({
  where: {
    projectId: data.projectId,
    userId: session.user.id
  }
});

if (!member) {
  return Response.json(
    { error: 'Not a project member' },
    { status: 403 }
  );
}
```

### Database Operations

**Use try-catch for error handling:**
```typescript
try {
  const project = await prisma.project.create({ data });
  return Response.json(project, { status: 201 });
} catch (error) {
  console.error('Project creation error:', error);
  return Response.json(
    { error: 'Failed to create project' },
    { status: 500 }
  );
}
```

---

## 📝 Creating New API Routes

**Template:**
```typescript
// app/api/resource/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await prisma.resource.findMany({
      where: { userId: session.user.id }
    });
    return Response.json(data);
  } catch (error) {
    console.error('GET error:', error);
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    if (!body.requiredField) {
      return Response.json(
        { error: 'Required field missing' },
        { status: 400 }
      );
    }

    const created = await prisma.resource.create({
      data: {
        ...body,
        userId: session.user.id
      }
    });

    return Response.json(created, { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return Response.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
