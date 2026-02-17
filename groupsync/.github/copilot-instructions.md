# GitHub Copilot Instructions for GroupSync

> **Instructions for GitHub Copilot.** For full guidelines, see `../.ai/CLAUDE.md`

## Project Context

**GroupSync** is a student collaboration app for group projects.

**Tech Stack:**
- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL (Neon)
- Tailwind CSS v4 + shadcn/ui
- NextAuth.js for authentication

## Key Guidelines

### Code Style

1. **TypeScript Strict**
   - No `any` types
   - Define proper interfaces
   - Type all function parameters and returns

2. **React Components**
   - Server components by default (no 'use client')
   - Client components only when needed (state, events, browser APIs)
   - Functional components with TypeScript interfaces for props

3. **Styling**
   - Use Tailwind CSS utility classes
   - Mobile-first responsive design
   - Use shadcn/ui components from `@/components/ui/`

### Architecture Patterns

**Server Component (default):**
```typescript
export default async function Page() {
  const data = await prisma.model.findMany();
  return <ClientComponent data={data} />;
}
```

**Client Component (interactive):**
```typescript
'use client';
import { useState } from 'react';

export function Component({ data }: Props) {
  const [state, setState] = useState(data);
  // ...
}
```

**API Route:**
```typescript
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ...
}
```

### Database Access

- Use Prisma for all database queries
- Check permissions before data access
- Use transactions for multi-step operations

```typescript
// Good
const project = await prisma.project.findUnique({
  where: { id },
  include: { members: true }
});

if (!project) {
  return Response.json({ error: 'Not found' }, { status: 404 });
}
```

### Authentication

- Check session in all protected API routes
- Verify project membership before data access
- Use middleware for route protection

```typescript
const session = await getServerSession(authOptions);
if (!session?.user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## File Organization

```
app/              - Pages and API routes
components/       - React components
lib/              - Utilities and helpers
prisma/           - Database schema
types/            - TypeScript type definitions
aiDocs/           - Team documentation (tracked)
ai/               - Personal workspace (gitignored)
```

## Best Practices

✅ **Do:**
- Keep functions small and focused
- Use descriptive variable names
- Add types to all functions
- Validate inputs in API routes
- Handle errors gracefully
- Use Tailwind for styling

❌ **Don't:**
- Use `any` type
- Add "just in case" features
- Comment out code (delete it)
- Over-engineer solutions
- Add inline styles
- Skip error handling

## Common Patterns

**Form Handling:**
```typescript
'use client';
const [formData, setFormData] = useState({});
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(formData)
  });
  // Handle response
};
```

**Data Fetching:**
```typescript
// Server Component
const data = await prisma.model.findMany({
  where: { userId },
  include: { related: true }
});
```

**Toast Notifications:**
```typescript
import { toast } from 'sonner';
toast.success('Saved!');
toast.error('Failed');
```

## Quick Reference

- Universal Instructions: `../.ai/CLAUDE.md`
- Project Context: `aiDocs/context.md`
- API Reference: `aiDocs/api-guide.md`
- Component Library: `aiDocs/component-library.md`

---

**Generated Code Should:**
1. Follow TypeScript strict mode
2. Use existing patterns from codebase
3. Include proper error handling
4. Be mobile-responsive
5. Match the project's coding standards

For complete guidelines, always refer to `../.ai/CLAUDE.md` and `aiDocs/`.
