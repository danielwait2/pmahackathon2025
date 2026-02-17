# GroupSync Coding Standards

> **Style guide and best practices.** Follow these conventions for consistent code quality.

---

## 🎯 Core Principles

1. **Simplicity Over Cleverness** - Write code that's easy to understand
2. **No Over-Engineering** - Build only what's needed
3. **Delete, Don't Comment Out** - Remove unused code completely
4. **Type Safety** - Use TypeScript strictly, avoid `any`
5. **Consistency** - Match existing patterns in the codebase

---

## 📝 TypeScript Standards

### Type Definitions

**Use interfaces for object shapes:**
```typescript
// ✅ Good
interface Project {
  id: string;
  name: string;
  deadline?: Date;
}

// ❌ Bad
type Project = {
  id: any;
  name: any;
};
```

**Define types in `types/index.ts`:**
```typescript
// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardProject extends Project {
  memberCount: number;
  taskCount: number;
}
```

**Avoid `any` - use `unknown` or proper types:**
```typescript
// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}

// ❌ Bad
function processData(data: any) {
  return data.toUpperCase();
}
```

### Strict Mode

**Always use strict TypeScript:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## ⚛️ React Component Standards

### Component Structure

**Functional components with TypeScript:**
```typescript
// ✅ Good: Server Component
interface ProjectHeaderProps {
  project: Project;
  className?: string;
}

export function ProjectHeader({ project, className }: ProjectHeaderProps) {
  return (
    <header className={cn('flex items-center', className)}>
      <h1>{project.name}</h1>
    </header>
  );
}

// ✅ Good: Client Component
'use client';
import { useState } from 'react';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  // ...
}
```

**Avoid default exports for components:**
```typescript
// ✅ Good
export function Button() { }

// ❌ Bad
export default function Button() { }
```

### Server vs Client Components

**Default to Server Components:**
```typescript
// Server Component (default - no 'use client')
export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

**Use Client Components when needed:**
```typescript
// Client Component (interactive)
'use client';

export function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleDrop = (task: Task) => {
    // Browser APIs, state, events = client
  };

  return <DndContext onDrop={handleDrop}>...</DndContext>;
}
```

### Props

**Always type props:**
```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  // ...
}

// ❌ Bad
export function Button({ onClick, children, variant }) {
  // No types!
}
```

**Use object destructuring:**
```typescript
// ✅ Good
function Component({ name, age }: Props) { }

// ❌ Bad
function Component(props: Props) {
  const name = props.name;
}
```

---

## 🎨 Styling Standards

### Tailwind CSS

**Use Tailwind utility classes:**
```tsx
// ✅ Good
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click me
</button>

// ❌ Bad (inline styles)
<button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  Click me
</button>
```

**Use `cn()` utility for conditional classes:**
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

**Mobile-first responsive design:**
```tsx
// ✅ Good (default mobile, scale up)
<div className="w-full md:w-1/2 lg:w-1/3">

// ❌ Bad (desktop first)
<div className="w-1/3 md:w-1/2 sm:w-full">
```

### Component Styling

**Extract repeated utilities to components:**
```typescript
// If you use the same classes 3+ times, make a component
// ✅ Good
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      {children}
    </div>
  );
}

// Use it
<Card>Content</Card>
```

---

## 📂 File Organization

### File Naming

**Use PascalCase for components:**
```
components/
  ProjectCard.tsx
  TaskBoard.tsx
  UserAvatar.tsx
```

**Use kebab-case for utilities:**
```
lib/
  calendar-utils.ts
  date-helpers.ts
  api-client.ts
```

**Use lowercase for API routes:**
```
app/api/
  projects/route.ts
  tasks/route.ts
```

### Import Order

```typescript
// 1. External dependencies
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { Project } from '@/types';

// 3. Relative imports
import { ProjectCard } from './ProjectCard';

// 4. CSS/assets (if any)
import './styles.css';
```

---

## 🗄️ Database & API Standards

### Prisma Queries

**Always use proper types:**
```typescript
// ✅ Good
const projects = await prisma.project.findMany({
  where: { createdById: userId },
  include: { members: true }
});
// Type is: (Project & { members: ProjectMember[] })[]

// ❌ Bad
const projects: any = await prisma.project.findMany();
```

**Limit fields with `select`:**
```typescript
// ✅ Good (only fetch what you need)
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true }
});

// ❌ Bad (fetches everything including password!)
const user = await prisma.user.findUnique({
  where: { id }
});
```

**Check for null before using:**
```typescript
// ✅ Good
const project = await prisma.project.findUnique({ where: { id } });
if (!project) {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
// Now TypeScript knows project is not null

// ❌ Bad
const project = await prisma.project.findUnique({ where: { id } });
return project.name; // Could be null!
```

### API Routes

**Consistent error handling:**
```typescript
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.name) {
      return Response.json({ error: 'Name required' }, { status: 400 });
    }

    const result = await prisma.project.create({ data });
    return Response.json(result, { status: 201 });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
```

---

## 🔧 Code Quality

### Naming Conventions

**Variables: camelCase**
```typescript
const projectName = 'My Project';
const userEmail = 'user@example.com';
```

**Constants: UPPER_SNAKE_CASE**
```typescript
const MAX_TASKS_PER_PROJECT = 100;
const DEFAULT_RESPONSE_TIME = 24;
```

**Functions: camelCase, descriptive verbs**
```typescript
// ✅ Good
function calculateAvailableSlots() { }
function validateUserPermissions() { }
function formatDateTime() { }

// ❌ Bad
function calc() { }
function check() { }
function format() { }
```

**Components: PascalCase, noun-based**
```typescript
// ✅ Good
function ProjectCard() { }
function TaskList() { }
function UserAvatar() { }

// ❌ Bad
function projectcard() { }
function GetTasks() { }  // Verbs for components
```

### Comments

**Write self-documenting code first:**
```typescript
// ✅ Good (code is clear)
const upcomingMeetings = meetings.filter(m =>
  new Date(m.date) > new Date()
);

// ❌ Bad (needs comment to understand)
const m = meetings.filter(x => new Date(x.date) > new Date()); // Get upcoming
```

**Add comments for complex logic only:**
```typescript
// ✅ Good
// Find overlapping time slots where ALL team members are available
// Algorithm: Count availability per slot, filter by memberCount
const overlappingSlots = findOverlaps(availabilities, memberCount);

// ❌ Bad
// Loop through meetings
meetings.forEach(meeting => { });
```

**Remove commented-out code:**
```typescript
// ✅ Good
function doWork() {
  return result;
}

// ❌ Bad
function doWork() {
  // const oldWay = something();
  // return oldWay.process();
  return result;
}
```

### Functions

**Keep functions small and focused:**
```typescript
// ✅ Good (single responsibility)
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 8;
}

function validateUser(user: User): boolean {
  return validateEmail(user.email) && validatePassword(user.password);
}

// ❌ Bad (too much in one function)
function validateUser(user: User): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return false;
  if (user.password.length < 8) return false;
  if (user.name.length === 0) return false;
  return true;
}
```

**Limit function parameters (max 3):**
```typescript
// ✅ Good
interface CreateProjectParams {
  name: string;
  description?: string;
  deadline?: Date;
  classId?: string;
}

function createProject(params: CreateProjectParams) { }

// ❌ Bad
function createProject(
  name: string,
  description: string,
  deadline: Date,
  classId: string,
  userId: string
) { }
```

---

## 🚫 Anti-Patterns to Avoid

### Don't Over-Engineer

```typescript
// ❌ Bad (premature abstraction)
class ProjectFactory {
  private strategy: CreationStrategy;
  constructor(config: FactoryConfig) { }
  create() { }
}

// ✅ Good (simple and direct)
async function createProject(data: ProjectData) {
  return await prisma.project.create({ data });
}
```

### Don't Add "Just in Case" Features

```typescript
// ❌ Bad
interface Task {
  id: string;
  title: string;
  futureField1?: unknown;  // "might need this later"
  futureField2?: unknown;
}

// ✅ Good (add fields when actually needed)
interface Task {
  id: string;
  title: string;
}
```

### Don't Create Helpers for One-Time Use

```typescript
// ❌ Bad (used once)
function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const title = capitalizeFirstLetter(input);

// ✅ Good (inline if used once)
const title = input.charAt(0).toUpperCase() + input.slice(1);
```

---

## ✅ Code Review Checklist

Before submitting PR, verify:

**TypeScript:**
- [ ] No `any` types
- [ ] All props typed
- [ ] No TypeScript errors (`npx tsc --noEmit`)

**React:**
- [ ] Server components by default
- [ ] Client components only when needed
- [ ] Proper key props in lists
- [ ] No unnecessary useEffect

**Styling:**
- [ ] Tailwind classes (no inline styles)
- [ ] Mobile-first responsive
- [ ] Consistent spacing/sizing

**Code Quality:**
- [ ] Functions are small and focused
- [ ] Names are descriptive
- [ ] No commented-out code
- [ ] No console.logs (except errors)

**Performance:**
- [ ] No N+1 queries
- [ ] Images optimized
- [ ] No unnecessary re-renders

**Security:**
- [ ] Input validation
- [ ] Auth checks in API routes
- [ ] No secrets in code

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
