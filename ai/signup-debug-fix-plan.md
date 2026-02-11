# Signup Submit Error - Debug & Fix Plan

## Goal
Fix the error that occurs when clicking **Sign up** (`/signup`) and ensure account creation + auto-login works reliably.

## Scope
- Frontend signup flow: `groupsync/components/auth/SignupForm.tsx`
- Signup API route: `groupsync/app/api/auth/signup/route.ts`
- Auth config: `groupsync/lib/auth.ts`
- Prisma + DB wiring: `groupsync/lib/prisma.ts`, `groupsync/prisma/schema.prisma`, local SQLite file

## Working Assumption
The submit error is most likely from one of these paths:
1. `POST /api/auth/signup` returns non-2xx
2. `signIn('credentials')` fails after successful user create
3. Prisma/database runtime issue in route handler

## Phase 1 - Reproduce and Capture Exact Failure
1. Start app in dev mode from `groupsync`.
2. Open browser devtools and capture:
- Network request for `POST /api/auth/signup` (status + JSON body)
- Console errors on submit
- Terminal/server stack trace at the same timestamp
3. Record whether failure happens:
- Before user create
- After user create but during auto-login

### Exit Criteria
- We have exact failing layer (client validation, API route, auth sign-in, or DB).

## Phase 2 - Isolate by Layer
1. Validate client payload from `SignupForm`:
- `name`, `email`, `password` present
- password length >= 6
- confirm password match
2. Validate API route behavior directly:
- Use curl/HTTP client against `/api/auth/signup` with valid payload
- Confirm deterministic JSON response for success and error cases
3. Validate credentials auth independently:
- If signup succeeds, manually log in via `/login`
- If manual login fails, inspect `groupsync/lib/auth.ts` password compare flow
4. Validate DB writes:
- Check `users` row inserted in SQLite after signup
- Verify unique email behavior and error message correctness

### Exit Criteria
- Single root cause identified with reproducible steps.

## Phase 3 - Implement Fix
Apply smallest safe fix based on root cause:
- If API response handling is brittle: normalize route responses and client error parsing
- If Prisma/DB issue: correct DB path/env/migration/client setup
- If auth handoff issue: adjust signup-to-signin flow and handle partial success cleanly
- If race condition: ensure user create commit before sign-in attempt

### Guardrails
- Preserve existing UX behavior (toast + redirect)
- Keep errors user-readable and specific
- No silent failures

## Phase 4 - Verify End-to-End
Run these checks:
1. New user signup succeeds and redirects to `/dashboard`
2. Duplicate email returns clean error
3. Invalid short password returns clean error
4. Successful signup but forced sign-in failure path still routes user to `/login` with message
5. Existing login (`/login`) still works for created users

## Phase 5 - Hardening (Small Follow-ups)
1. Add structured server error logging in signup route (dev-safe).
2. Add one integration-style check for signup API happy path + duplicate email.
3. Add a short troubleshooting note in `ai/next-steps.md` if setup dependency is discovered (e.g., DB/migrations/env).

## Likely Fix Targets (Code Hotspots)
- `groupsync/app/api/auth/signup/route.ts`
- `groupsync/components/auth/SignupForm.tsx`
- `groupsync/lib/auth.ts`
- `groupsync/lib/prisma.ts`

## Deliverables
- Code fix committed in app code
- Brief root-cause writeup (1-2 paragraphs)
- Verification notes with actual observed results for the 5 checks above
