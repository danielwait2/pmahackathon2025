# GroupSync Component Library

> **Reusable component catalog.** Reference this when building or using components.

---

## 📦 Component Categories

1. **UI Primitives** (`components/ui/`) - shadcn/ui base components
2. **Auth Components** (`components/auth/`) - Login, signup forms
3. **Dashboard Components** (`components/dashboard/`) - Project cards, lists
4. **Project Components** (`components/project/`) - Tasks, availability, meetings
5. **Landing Components** (`components/landing/`) - Marketing pages

---

## 🎨 UI Primitives (shadcn/ui)

### Button

**File:** `components/ui/button.tsx`

**Usage:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants:**
- `default` - Primary blue button
- `destructive` - Red button for dangerous actions
- `outline` - Bordered button
- `ghost` - Minimal button
- `link` - Text button

---

### Card

**File:** `components/ui/card.tsx`

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

### Dialog (Modal)

**File:** `components/ui/dialog.tsx`

**Usage:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    <p>Modal content</p>
  </DialogContent>
</Dialog>
```

---

### Input

**File:** `components/ui/input.tsx`

**Usage:**
```tsx
import { Input } from '@/components/ui/input';

<Input
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

### Select (Dropdown)

**File:** `components/ui/select.tsx`

**Usage:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Choose option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Toast (Notifications)

**File:** Uses `sonner` library

**Usage:**
```tsx
import { toast } from 'sonner';

// Success toast
toast.success('Project created!');

// Error toast
toast.error('Failed to save');

// Info toast
toast('Info message');

// With action
toast('Are you sure?', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo')
  }
});
```

---

## 🔐 Auth Components

### LoginForm

**File:** `components/auth/LoginForm.tsx`

**Type:** Client Component

**Features:**
- Email/password fields
- Form validation
- Error handling
- Submit to NextAuth
- Redirect on success

**Usage:**
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

// In login page
export default function LoginPage() {
  return <LoginForm />;
}
```

---

### SignupForm

**File:** `components/auth/SignupForm.tsx`

**Type:** Client Component

**Features:**
- Name, email, password fields
- Password confirmation
- Validation
- Creates user via API
- Redirects to login

**Usage:**
```tsx
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return <SignupForm />;
}
```

---

## 📊 Dashboard Components

### ProjectCard

**File:** `components/dashboard/ProjectCard.tsx`

**Type:** Client Component

**Props:**
```typescript
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    deadline?: Date;
    className?: string;
    memberCount: number;
    taskCount: number;
    completedTaskCount: number;
  };
}
```

**Features:**
- Displays project name, class, deadline
- Shows member count
- Progress bar (tasks completed/total)
- Click to navigate to project

**Usage:**
```tsx
<ProjectCard project={project} />
```

---

### ProjectList

**File:** `components/dashboard/ProjectList.tsx`

**Type:** Server Component

**Props:**
```typescript
interface ProjectListProps {
  projects: DashboardProject[];
}
```

**Features:**
- Renders grid of ProjectCards
- Empty state when no projects
- Responsive layout (1-3 columns)

---

### CreateProjectWizard

**File:** `components/dashboard/CreateProjectWizard.tsx`

**Type:** Client Component

**Features:**
- Multi-step form (3 steps)
- Step 1: Basic info (name, description, deadline, class)
- Step 2: Team agreement setup
- Step 3: Invite members (shows invite code)
- Creates project via API
- Generates invite code
- Redirects to project on completion

**Usage:**
```tsx
import { CreateProjectWizard } from '@/components/dashboard/CreateProjectWizard';

<Dialog>
  <DialogContent>
    <CreateProjectWizard onComplete={() => router.refresh()} />
  </DialogContent>
</Dialog>
```

---

## 📋 Project Components

### ProjectHeader

**File:** `components/project/ProjectHeader.tsx`

**Type:** Client Component

**Props:**
```typescript
interface ProjectHeaderProps {
  project: Project;
  className?: string;
}
```

**Features:**
- Project name and class
- Deadline badge (with countdown)
- Invite button (copies code)
- Settings dropdown

---

### TaskBoard

**File:** `components/project/TaskBoard.tsx`

**Type:** Client Component

**Props:**
```typescript
interface TaskBoardProps {
  tasks: Task[];
  projectId: string;
}
```

**Features:**
- Kanban board (To Do, In Progress, Done)
- Drag and drop task cards
- Updates task status on drop
- Add task button per column

---

### TaskCard

**File:** `components/project/TaskCard.tsx`

**Type:** Client Component

**Props:**
```typescript
interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
}
```

**Features:**
- Task title and description
- Assigned user avatar
- Due date badge
- Status indicator
- Click to open detail modal

---

### AvailabilityGrid

**File:** `components/project/AvailabilityGrid.tsx`

**Type:** Client Component

**Props:**
```typescript
interface AvailabilityGridProps {
  projectId: string;
  userId?: string;
  guestMemberId?: string;
  initialSlots?: TimeSlot[];
}
```

**Features:**
- Weekly grid (Mon-Sun)
- 30-minute time slots (8 AM - 10 PM)
- Click to toggle availability
- Drag to select multiple
- Save to database
- Mobile: List view with time pickers

---

### TeamAvailability

**File:** `components/project/TeamAvailability.tsx`

**Type:** Server Component

**Props:**
```typescript
interface TeamAvailabilityProps {
  availability: Availability[];
  members: Member[];
}
```

**Features:**
- Read-only grid showing team overlaps
- Color intensity = number of people available
- Hover shows who's available
- Legend explaining colors

---

### MeetingFinder

**File:** `components/project/MeetingFinder.tsx`

**Type:** Client Component

**Props:**
```typescript
interface MeetingFinderProps {
  availability: Availability[];
  members: Member[];
  projectId: string;
}
```

**Features:**
- Analyzes team availability
- Finds overlapping time slots
- Ranks by duration and preference
- Displays top 5 suggestions
- "Schedule" button creates meeting
- Handles no-overlap case (partial matches)

---

### TeamAgreement

**File:** `components/project/TeamAgreement.tsx`

**Type:** Client Component

**Props:**
```typescript
interface TeamAgreementProps {
  agreement: TeamAgreement;
  members: Member[];
  isOwner: boolean;
  currentUserId: string;
}
```

**Features:**
- Displays agreement details
- Shows who agreed (checkmarks)
- "I Agree" button for members
- "Edit" button for owner (opens modal)
- Visual progress toward full alignment

---

### UpcomingMeetings

**File:** `components/project/UpcomingMeetings.tsx`

**Type:** Server Component

**Props:**
```typescript
interface UpcomingMeetingsProps {
  meetings: Meeting[];
}
```

**Features:**
- List of upcoming meetings
- Date, time, title
- "Add to Calendar" dropdown per meeting
- Delete button (owner only)
- Empty state if no meetings

---

## 🏠 Landing Components

### Hero

**File:** `components/landing/Hero.tsx`

**Features:**
- Headline and subheadline
- CTA buttons (signup, join)
- App preview mockup

---

### ProblemSection

**File:** `components/landing/ProblemSection.tsx`

**Features:**
- Survey statistics
- Pain point cards
- Social proof

---

### Features

**File:** `components/landing/Features.tsx`

**Features:**
- Feature cards with icons
- Benefits highlights
- Screenshots/demos

---

## 🔧 Utility Components

### LoadingSpinner

**Usage:**
```tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
```

---

### EmptyState

**Usage:**
```tsx
export function EmptyState({ message, action }: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}
```

---

## 📚 Component Patterns

### Server Component Pattern

```typescript
// Fetch data on server
export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { members: true, tasks: true }
  });

  if (!project) {
    notFound();
  }

  // Pass data to client components
  return <ProjectView project={project} />;
}
```

### Client Component Pattern

```typescript
'use client';
import { useState } from 'react';

export function InteractiveComponent({ initialData }: { initialData: Data }) {
  const [state, setState] = useState(initialData);

  const handleAction = async () => {
    // Call API
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(state)
    });

    if (response.ok) {
      toast.success('Saved!');
    }
  };

  return <div onClick={handleAction}>...</div>;
}
```

### Form Pattern

```typescript
'use client';
import { useState } from 'react';

export function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message);
        return;
      }

      toast.success('Success!');
      setFormData({ name: '', email: '' }); // Reset
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Submit'}
      </Button>
    </form>
  );
}
```

---

## 📝 Adding New Components

### Checklist:

1. **Choose type:** Server or Client component?
2. **Define props:** Create TypeScript interface
3. **Extract to file:** Name clearly (PascalCase)
4. **Add to this doc:** Document usage and props
5. **Test:** Desktop and mobile viewports

### Template:

```typescript
// components/category/ComponentName.tsx
interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: number;
}

export function ComponentName({ requiredProp, optionalProp }: ComponentNameProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
