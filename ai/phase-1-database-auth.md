# Phase 1: Database & Auth

> **Time Estimate:** 1.5 hours
> **Priority:** MUST
> **Prerequisites:** Phase 0 complete, Supabase account
> **Rubric:** Technical Considerations (proper auth, database design)

---

## Goal

Set up the Supabase backend — database schema with Row Level Security, authentication flows, and protected routes.

---

## Steps

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, name it "groupsync"
4. Set a strong database password (save it somewhere safe)
5. Select the closest region
6. Wait for project to be provisioned

Once ready, copy:
- **Project URL** (Settings > API > Project URL)
- **Anon/Public Key** (Settings > API > Project API keys > anon/public)

Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.2 Run Database Migration

Go to **Supabase Dashboard > SQL Editor** and run the following SQL. This creates all 6 tables, RLS policies, functions, and triggers.

```sql
-- ============================================
-- GroupSync Database Schema
-- ============================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROJECTS
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROJECT MEMBERS
CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. AVAILABILITY
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  slots JSONB DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 5. TASKS
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done')) DEFAULT 'todo',
  due_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEAM AGREEMENTS
CREATE TABLE team_agreements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  response_time_hours INTEGER DEFAULT 24,
  meeting_frequency TEXT,
  communication_channel TEXT,
  quality_standards TEXT,
  agreed_by UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate 6-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM projects WHERE invite_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  NEW.invite_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code
  BEFORE INSERT ON projects
  FOR EACH ROW
  WHEN (NEW.invite_code IS NULL)
  EXECUTE FUNCTION generate_invite_code();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_agreements ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read any profile, update only their own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- PROJECTS: Viewable by members only
CREATE POLICY "Projects viewable by members"
  ON projects FOR SELECT USING (
    id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project owners can update"
  ON projects FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Allow reading project by invite code (for join flow)
CREATE POLICY "Projects viewable by invite code"
  ON projects FOR SELECT USING (
    invite_code IS NOT NULL
  );

-- PROJECT MEMBERS: Viewable by fellow members
CREATE POLICY "Members viewable by project members"
  ON project_members FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can join projects"
  ON project_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave projects"
  ON project_members FOR DELETE USING (auth.uid() = user_id);

-- AVAILABILITY: Users can see all in their projects, edit only their own
CREATE POLICY "Availability viewable by project members"
  ON availability FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own availability"
  ON availability FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE USING (auth.uid() = user_id);

-- TASKS: Viewable and editable by project members
CREATE POLICY "Tasks viewable by project members"
  ON tasks FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Project members can create tasks"
  ON tasks FOR INSERT WITH CHECK (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Project members can update tasks"
  ON tasks FOR UPDATE USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Project members can delete tasks"
  ON tasks FOR DELETE USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- TEAM AGREEMENTS: Viewable by members, editable by project owner
CREATE POLICY "Agreements viewable by project members"
  ON team_agreements FOR SELECT USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Project owners can create agreements"
  ON team_agreements FOR INSERT WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Project owners can update agreements"
  ON team_agreements FOR UPDATE USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Allow members to update agreed_by (for "I Agree" button)
CREATE POLICY "Members can agree to team agreements"
  ON team_agreements FOR UPDATE USING (
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );
```

### 1.3 Verify Database

After running the SQL:
1. Go to **Table Editor** in Supabase dashboard
2. Confirm all 6 tables exist: profiles, projects, project_members, availability, tasks, team_agreements
3. Check that RLS is enabled (lock icon on each table)
4. Go to **Authentication > Policies** and verify policies are listed

### 1.4 Set Up Supabase Client

Create `lib/supabase.ts` with two client configurations:

**Browser client** — used in Client Components (`"use client"`):
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Server client** — used in Server Components, Route Handlers, and Middleware:
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies, ignore
          }
        },
      },
    }
  );
}
```

### 1.5 Create Auth Components

**`components/auth/AuthProvider.tsx`**
- Client component wrapping the app
- Uses `supabase.auth.onAuthStateChange()` to track session
- Provides `user`, `session`, `loading` via React context
- Export `useAuth()` hook

**`components/auth/LoginForm.tsx`**
- Email + password fields using shadcn `Input` and `Form`
- `supabase.auth.signInWithPassword()`
- Error handling → show toast on failure
- On success → `router.push('/dashboard')`
- Link to `/signup`

**`components/auth/SignupForm.tsx`**
- Name + email + password + confirm password fields
- `supabase.auth.signUp()` with `options.data.name` in metadata
- The `handle_new_user` trigger auto-creates the profile
- Error handling → show toast
- On success → `router.push('/dashboard')`
- Link to `/login`

**`app/(auth)/login/page.tsx`**
- Centered card layout
- Renders `<LoginForm />`
- "GroupSync" branding at top

**`app/(auth)/signup/page.tsx`**
- Centered card layout
- Renders `<SignupForm />`
- "GroupSync" branding at top

### 1.6 Create Auth Middleware

**`middleware.ts`** at project root:

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protected routes — redirect to login if not authenticated
  if (!user && (
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/project')
  )) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'
  )) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/project/:path*', '/login', '/signup'],
};
```

### 1.7 Update Root Layout

Update `app/layout.tsx` to wrap with `AuthProvider` and toast provider:

```typescript
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/toaster';

// In the body:
<AuthProvider>
  {children}
  <Toaster />
</AuthProvider>
```

### 1.8 Test Authentication

1. Start dev server: `npm run dev`
2. Navigate to `/signup` — create a test account
3. Check Supabase dashboard > Authentication > Users — user should appear
4. Check Table Editor > profiles — profile row should exist (created by trigger)
5. Navigate to `/dashboard` — should be accessible when logged in
6. Log out, try `/dashboard` — should redirect to `/login`
7. Log in — should redirect to `/dashboard`

---

## Checklist

- [ ] Supabase project created
- [ ] Project URL and anon key saved to `.env.local`
- [ ] SQL migration run successfully (6 tables created)
- [ ] RLS enabled and policies verified in dashboard
- [ ] Invite code trigger tested (insert a project row, code auto-generated)
- [ ] Profile trigger tested (sign up a user, profile row created)
- [ ] `lib/supabase.ts` — browser client working
- [ ] `lib/supabase.ts` — server client working
- [ ] `components/auth/AuthProvider.tsx` — context + hook working
- [ ] `components/auth/LoginForm.tsx` — renders, handles login
- [ ] `components/auth/SignupForm.tsx` — renders, handles signup
- [ ] `app/(auth)/login/page.tsx` — page renders
- [ ] `app/(auth)/signup/page.tsx` — page renders
- [ ] `middleware.ts` — protects /dashboard and /project routes
- [ ] Sign up creates user + profile
- [ ] Login redirects to /dashboard
- [ ] Unauthenticated access to /dashboard redirects to /login
- [ ] Logged-in access to /login redirects to /dashboard

---

## Troubleshooting

**"Invalid API key"** — Check that `.env.local` has the correct anon key (not the service role key).

**Profile not created on signup** — Verify the `on_auth_user_created` trigger exists. Check Supabase Logs > Database.

**RLS blocking queries** — Temporarily disable RLS on a table to test, then re-enable. Check that the user is passing their JWT.

**Middleware not firing** — Check the `matcher` config. Restart dev server after changing middleware.

---

## Next Phase

When all items are checked, proceed to [Phase 2: Landing Page](phase-2-landing-page.md).
