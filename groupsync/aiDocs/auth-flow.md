# GroupSync Authentication Flow

> **Authentication and authorization implementation.** Read this when working with auth.

---

## 🔐 Authentication Overview

**System:** NextAuth.js 4.24
**Provider:** Credentials (email + password)
**Session:** JWT stored in HTTP-only cookies
**Password Hashing:** bcryptjs (10 rounds)

---

## 🔄 Authentication Flow

### Signup Flow

```
User submits signup form
    ↓
POST /api/auth/signup
    ↓
Validate email/password
    ↓
Check if email already exists
    ↓
Hash password with bcrypt
    ↓
Create user in database
    ↓
Return user (without password)
    ↓
Redirect to login
```

**Implementation:** `app/api/auth/signup/route.ts`

### Login Flow

```
User submits login form
    ↓
POST /api/auth/signin/credentials
    ↓
NextAuth calls authorize() function
    ↓
Find user by email
    ↓
Compare password with bcrypt
    ↓
Return user object (if valid)
    ↓
NextAuth creates JWT session
    ↓
Set session cookie
    ↓
Redirect to /dashboard
```

**Implementation:** `lib/auth.ts` (authOptions.providers.credentials.authorize)

### Session Management

```
User visits protected route
    ↓
Middleware checks for session cookie
    ↓
NextAuth verifies JWT signature
    ↓
Session available via getServerSession()
    ↓
Components can access user data
```

---

## 🛠️ Implementation Details

### Auth Configuration

**File:** `lib/auth.ts`

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};
```

### Middleware (Route Protection)

**File:** `middleware.ts`

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login'
  }
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/project/:path*'
  ]
};
```

**How it works:**
- Intercepts requests to protected routes
- Checks for valid session
- Redirects to `/login` if not authenticated

---

## 🔑 Using Auth in Components

### Server Components

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = session.user.id;
  const projects = await prisma.project.findMany({
    where: { createdById: userId }
  });

  return <div>Welcome {session.user.name}</div>;
}
```

### Client Components

```typescript
'use client';
import { useSession } from 'next-auth/react';

export function ProfileButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <div>Hello, {session.user.name}</div>;
}
```

### API Routes

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  // Use userId for queries
}
```

---

## 👤 User Registration

**File:** `app/api/auth/signup/route.ts`

```typescript
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return Response.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return Response.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true
        // Don't return password!
      }
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

---

## 🔒 Authorization (Permissions)

### Check Project Membership

```typescript
async function verifyProjectMember(
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId
    }
  });

  return !!member;
}

// Usage in API route
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const isMember = await verifyProjectMember(
    projectId!,
    session.user.id
  );

  if (!isMember) {
    return Response.json(
      { error: 'Not a project member' },
      { status: 403 }
    );
  }

  // Proceed with request
}
```

### Check Project Owner

```typescript
async function verifyProjectOwner(
  projectId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: 'owner'
    }
  });

  return !!member;
}
```

---

## 👥 Guest Access

GroupSync supports **guest users** for public availability submission.

### Guest Flow

```
User clicks share link with token
    ↓
Loads /share/[token] (public route)
    ↓
Guest enters name (no auth required)
    ↓
Guest selects availability
    ↓
POST /api/availability (with guestMemberId)
    ↓
Availability stored
```

**Implementation:**
- No authentication required for share links
- Guest identified by `guestMemberId` in ProjectMember table
- `userId` is null for guest members

---

## 🔐 Security Best Practices

### Password Handling
- ✅ Hash with bcrypt (10 rounds minimum)
- ✅ Never return password in responses
- ✅ Validate minimum length (8 characters)
- ✅ Store hashed, never plaintext

### Session Security
- ✅ HTTP-only cookies (can't access via JavaScript)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite=lax (CSRF protection)
- ✅ JWT signature verification

### Input Validation
- ✅ Validate email format
- ✅ Sanitize inputs
- ✅ Check for SQL injection (Prisma handles this)
- ✅ Rate limiting (future: add rate limiting middleware)

### Authorization
- ✅ Always check session in protected routes
- ✅ Verify user permissions before data access
- ✅ Don't trust client-side auth state
- ✅ Validate on server (API routes)

---

## 🚨 Common Auth Issues

### "Unauthorized" on API calls
**Cause:** Session not passed to API route
**Fix:** Ensure cookies are sent with fetch requests

### Redirect loop between /login and /dashboard
**Cause:** Middleware and page both redirecting
**Fix:** Check session state before redirecting

### Session undefined in client component
**Cause:** Not wrapped in SessionProvider
**Fix:** Ensure root layout has SessionProvider

### Password comparison always fails
**Cause:** Password not hashed before comparison
**Fix:** Use bcrypt.compare(), not === comparison

---

## 🔧 Development Tips

### Testing Auth Locally

```typescript
// Create test user via Prisma Studio or API
POST /api/auth/signup
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "testpassword"
}

// Login
POST /api/auth/signin/credentials
{
  "email": "test@example.com",
  "password": "testpassword"
}
```

### Debugging Sessions

```typescript
// In server component
const session = await getServerSession(authOptions);
console.log('Session:', JSON.stringify(session, null, 2));

// In client component
const { data: session } = useSession();
console.log('Session:', session);
```

### Clear Session (Logout)

```typescript
'use client';
import { signOut } from 'next-auth/react';

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: '/login' })}>
      Logout
    </button>
  );
}
```

---

## 📚 Related Documentation

- **NextAuth.js Docs:** https://next-auth.js.org/
- **bcryptjs Docs:** https://github.com/dcodeIO/bcrypt.js
- **JWT Standard:** https://jwt.io/

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
