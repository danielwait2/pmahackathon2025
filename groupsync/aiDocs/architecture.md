# GroupSync Architecture

> **System design and technical architecture.** Read this to understand how GroupSync is built.

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Vercel CDN                       │
│              (Static + Server Rendering)            │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              Next.js 14 App Router                   │
│  ┌──────────────┬───────────────┬─────────────────┐ │
│  │   Server     │    Client     │   API Routes    │ │
│  │  Components  │  Components   │  (Backend API)  │ │
│  └──────┬───────┴───────┬───────┴────────┬────────┘ │
└─────────┼───────────────┼────────────────┼──────────┘
          │               │                │
          │               │                ▼
          │               │         ┌────────────┐
          │               │         │  Prisma    │
          │               │         │    ORM     │
          │               │         └─────┬──────┘
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐   ┌──────────┐
    │  Neon    │    │ Browser  │   │  Neon    │
    │   DB     │◄───┤   APIs   │   │   DB     │
    └──────────┘    └──────────┘   └──────────┘
   (PostgreSQL)      (LocalStorage)  (PostgreSQL)
```

---

## 🎯 Core Architectural Patterns

### 1. **Server-First Rendering**

**Default to Server Components for:**
- Initial page loads
- Data fetching
- SEO-critical content

**Use Client Components for:**
- User interactions (forms, buttons, modals)
- Browser APIs (localStorage, window, document)
- State management (useState, useContext, useReducer)
- Third-party libraries requiring browser environment

**Example:**
```typescript
// app/project/[id]/page.tsx (Server Component)
export default async function ProjectPage({ params }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { members: true, tasks: true }
  });

  return <ProjectView project={project} />;  // Pass data to client
}

// components/project/ProjectView.tsx (Client Component)
'use client';
export function ProjectView({ project }) {
  const [tasks, setTasks] = useState(project.tasks);
  // Interactive UI here
}
```

### 2. **Data Flow Pattern**

```
Server Component (fetch data)
    ↓
Client Component (render + interact)
    ↓
API Route (mutate data)
    ↓
Database (Prisma)
    ↓
Revalidate/Refetch
```

**Fetch:** Server components use Prisma directly
**Mutate:** Client components call API routes
**Sync:** Use router.refresh() or revalidatePath()

### 3. **Authentication Flow**

```
User Login
    ↓
NextAuth validates credentials
    ↓
JWT token created (session)
    ↓
Middleware checks protected routes
    ↓
Session available in components
```

**See:** [auth-flow.md](./auth-flow.md) for details

---

## 📂 Directory Architecture

### App Router Structure
```
app/
├── (auth)/                 # Auth group (shared layout)
│   ├── login/page.tsx      # Login page
│   └── signup/page.tsx     # Signup page
│
├── (dashboard)/            # Protected group (shared layout)
│   ├── dashboard/page.tsx  # Dashboard
│   └── project/[id]/page.tsx  # Project detail
│
├── join/[code]/page.tsx    # Invite code join (public)
├── share/[token]/page.tsx  # Public project view
│
├── api/                    # API routes
│   ├── auth/[...nextauth]/route.ts  # NextAuth
│   ├── projects/route.ts   # Project CRUD
│   ├── tasks/route.ts      # Task operations
│   ├── availability/route.ts  # Availability
│   └── meetings/route.ts   # Meeting scheduling
│
├── layout.tsx              # Root layout
├── page.tsx                # Landing page
└── globals.css             # Global styles
```

### Component Organization
```
components/
├── auth/                   # Authentication
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
│
├── dashboard/              # Dashboard features
│   ├── ProjectCard.tsx
│   ├── ProjectList.tsx
│   ├── CreateProjectWizard.tsx
│   └── JoinProjectModal.tsx
│
├── project/                # Project view features
│   ├── ProjectHeader.tsx
│   ├── AvailabilityGrid.tsx
│   ├── TaskBoard.tsx
│   ├── TeamAgreement.tsx
│   └── MeetingFinder.tsx
│
├── ui/                     # Reusable UI components (shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
│
└── landing/                # Landing page sections
    ├── Hero.tsx
    ├── ProblemSection.tsx
    └── Features.tsx
```

---

## 🔐 Security Architecture

### Authentication
- **Method:** NextAuth.js with credentials provider
- **Storage:** JWT tokens in HTTP-only cookies
- **Password:** bcrypt hashing (10 rounds)

### Authorization
- **Route Protection:** Middleware checks session
- **Data Access:** Check project membership in queries
- **API Routes:** Verify user permissions before mutations

### Data Validation
- **Client:** Form validation with React Hook Form
- **Server:** Validate all inputs in API routes
- **Database:** Prisma schema constraints

**See:** [auth-flow.md](./auth-flow.md)

---

## 💾 Database Architecture

### ORM Layer
- **Prisma Client** as the only database interface
- **No raw SQL** unless absolutely necessary
- **Type safety** from Prisma schema to TypeScript

### Data Access Patterns

**Server Components:**
```typescript
import { prisma } from '@/lib/db';

const projects = await prisma.project.findMany({
  where: { /* filters */ },
  include: { /* relations */ }
});
```

**API Routes:**
```typescript
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const data = await request.json();
  const project = await prisma.project.create({ data });
  return Response.json(project);
}
```

### Connection Management
- **Singleton Pattern:** `lib/db.ts` exports single Prisma instance
- **Connection Pooling:** Handled by Neon and Prisma
- **Serverless:** Connection pooling configured for Vercel

**See:** [database-schema.md](./database-schema.md)

---

## 🎨 UI/UX Architecture

### Styling System
- **Tailwind CSS v4** for utility-first styling
- **shadcn/ui** for accessible component primitives
- **CSS Variables** for theming (defined in globals.css)

### Responsive Design
- **Mobile-First:** Design for 375px width, scale up
- **Breakpoints:**
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

### Component Composition
```
Page (Server Component)
  ↓
Layout Components (structure)
  ↓
Feature Components (business logic)
  ↓
UI Components (primitives from shadcn)
```

---

## 🔄 State Management

### Server State
- **Fetched in Server Components**
- **Passed as props** to Client Components
- **Refetched** via router.refresh() or revalidatePath()

### Client State
- **useState** for local component state
- **useContext** for shared state (e.g., auth)
- **No global state library** (Redux, Zustand) - keep it simple

### Form State
- **Controlled components** with useState
- **Validation** with custom hooks
- **Submission** via API routes

---

## 🚀 Performance Architecture

### Rendering Strategy
- **Server Components** = zero client JavaScript
- **Code Splitting** = automatic via Next.js
- **Lazy Loading** = dynamic imports where needed

### Data Fetching
- **Server-side** = fast, no waterfall
- **Parallel Fetches** = Promise.all() for independent queries
- **Caching** = Next.js automatic caching

### Optimization Techniques
- **Image Optimization** via Next.js Image component
- **Font Optimization** via next/font (Geist)
- **Bundle Size** monitored via next build output

---

## 📡 API Design

### RESTful Conventions
```
GET    /api/projects        # List projects
POST   /api/projects        # Create project
GET    /api/projects/[id]   # Get project
PUT    /api/projects/[id]   # Update project
DELETE /api/projects/[id]   # Delete project
```

### Request/Response Format
```typescript
// Request
POST /api/projects
Content-Type: application/json
{
  "name": "Project Name",
  "description": "..."
}

// Response (Success)
HTTP 200 OK
{
  "id": "uuid",
  "name": "Project Name",
  "createdAt": "2026-02-14T..."
}

// Response (Error)
HTTP 400 Bad Request
{
  "error": "Project name is required"
}
```

**See:** [api-guide.md](./api-guide.md)

---

## 🌐 Deployment Architecture

```
GitHub Repo (main branch)
    ↓ (push)
Vercel Build Pipeline
    ↓
  Build Next.js App
    ↓
  Generate Prisma Client
    ↓
Deploy to Vercel Edge Network
    ↓
Connect to Neon PostgreSQL
```

**See:** [deployment.md](./deployment.md)

---

## 🔍 Monitoring & Debugging

### Development
- **Console Logs** for debugging (remove before commit)
- **React DevTools** for component inspection
- **Prisma Studio** for database inspection

### Production
- **Vercel Analytics** for performance metrics
- **Error Boundaries** for graceful error handling
- **Logging** via console.error (captured by Vercel)

---

## 🧪 Testing Strategy

### Manual Testing
- **Local Development:** `npm run dev`
- **Type Checking:** `npx tsc --noEmit`
- **Linting:** `npm run lint`
- **Build Test:** `npm run build`

### Automated Testing (Future)
- **Unit Tests:** Jest + React Testing Library
- **E2E Tests:** Playwright
- **API Tests:** Supertest

---

## 📈 Scalability Considerations

### Current Scale
- **Users:** ~100-1000 students
- **Projects:** ~50-500 active projects
- **Database:** Neon free tier sufficient

### Future Scale
- **Horizontal Scaling:** Vercel handles automatically
- **Database Scaling:** Neon supports connection pooling
- **Caching:** Add Redis for session/data caching if needed

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team

---

## 2026-02-28 Architecture Notes

### Recent collaborators query logic
- Source user: authenticated viewer on `project/[id]`.
- Query all `ProjectMember` rows for that user to get project IDs.
- Query other authenticated members across those project IDs, ordered by `joinedAt desc`.
- Deduplicate by `user.id` and take top N (currently 8) for the add-member dialog.

### Direct add-member flow
- Search endpoint: `GET /api/users/search?query=...`.
- Invite endpoint: `POST /api/projects/[id]/member-requests`.
- Incoming queue: `GET /api/user/invites`.
- Response endpoint: `PATCH /api/user/invites/[id]` with `{ action: "accept" | "decline" }`.
