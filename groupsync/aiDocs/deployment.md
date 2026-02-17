# GroupSync Deployment Guide

> **Deployment process and production setup.** Read this when deploying changes.

---

## 🚀 Deployment Overview

**Frontend & Backend:** Vercel
**Database:** Neon (serverless PostgreSQL)
**Deployment Trigger:** Push to `main` branch
**Build Time:** ~2-3 minutes

---

## 🏗️ Deployment Architecture

```
GitHub Repository (main branch)
    ↓ (automatic trigger on push)
Vercel Build Pipeline
    ├─ Install dependencies (npm ci)
    ├─ Generate Prisma Client (prisma generate)
    ├─ Build Next.js (npm run build)
    └─ Deploy to Edge Network
         ↓
Production URL (*.vercel.app)
         ↓ (connects to)
Neon PostgreSQL Database
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

**Vercel Dashboard → Settings → Environment Variables**

```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require

# NextAuth
NEXTAUTH_URL=https://[your-vercel-url].vercel.app
NEXTAUTH_SECRET=[generate-random-32-char-string]

# Optional: Future features
OPENAI_API_KEY=[your-openai-key]
```

### Generating NEXTAUTH_SECRET

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 📦 Build Configuration

### package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "prisma generate && next build",
    "start": "next start -p 3000",
    "postinstall": "prisma db push --skip-generate --accept-data-loss || true"
  }
}
```

**Important:**
- `prisma generate` runs before build (generates Prisma Client)
- `postinstall` ensures schema is pushed to Neon on deployment
- `--skip-generate` prevents duplicate generation
- `|| true` prevents build failure if schema unchanged

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci"
}
```

---

## 🗄️ Database Setup (Neon)

### Initial Setup

1. **Create Neon Project**
   - Go to https://neon.tech
   - Create new project: "GroupSync"
   - Region: Choose closest to users
   - Compute: Shared (free tier)

2. **Get Connection String**
   - Copy `DATABASE_URL` from Neon dashboard
   - Format: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`

3. **Add to Vercel**
   - Vercel Dashboard → Environment Variables
   - Add `DATABASE_URL` with value from Neon

### Database Migrations

**Development:**
```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Apply to development database
npx prisma db push
```

**Production:**
```bash
# Migrations run automatically via postinstall script
# Or manually via Vercel CLI:
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Database Inspection

```bash
# Open Prisma Studio (local)
npx prisma studio

# Connect to production database
# Set DATABASE_URL to production in .env.production.local
npx prisma studio
```

---

## 🔄 Deployment Workflow

### Automatic Deployment (Recommended)

```bash
# 1. Make changes locally
# 2. Test locally (npm run dev)
# 3. Commit changes
git add .
git commit -m "feat: description"

# 4. Push to main
git push origin main

# 5. Vercel automatically:
#    - Detects push
#    - Runs build
#    - Deploys to production
```

**Build Steps (Automatic):**
1. Clone repository
2. Install dependencies (`npm ci`)
3. Run `postinstall` (Prisma DB push)
4. Generate Prisma Client
5. Build Next.js app
6. Deploy to edge network
7. Assign production URL

### Manual Deployment (via Vercel CLI)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (preview)
vercel

# Deploy to production
vercel --prod
```

---

## 🌍 Production URLs

### Main Production URL
```
https://[project-name].vercel.app
```

### Custom Domain (Optional)
1. Vercel Dashboard → Domains
2. Add custom domain
3. Update DNS records (Vercel provides instructions)
4. Wait for SSL certificate (automatic)

### Preview Deployments

Every PR creates a preview deployment:
```
https://[project-name]-git-[branch-name]-[team].vercel.app
```

Use for testing before merging to main.

---

## 🔍 Monitoring & Logs

### Vercel Dashboard

**Deployments Tab:**
- See all deployments
- Build logs
- Runtime logs
- Deployment status

**Analytics Tab:**
- Page views
- Performance metrics
- Geographic data

**Logs Tab:**
- Real-time function logs
- Error tracking
- Console output

### Accessing Logs

```bash
# Via Vercel CLI
vercel logs [deployment-url]

# Follow logs in real-time
vercel logs --follow
```

---

## 🐛 Troubleshooting Deployments

### Build Fails

**Common Issues:**

1. **TypeScript Errors**
   ```
   Fix: Run `npx tsc --noEmit` locally
   Ensure no type errors before deploying
   ```

2. **Missing Dependencies**
   ```
   Fix: Ensure package.json includes all dependencies
   Run `npm install` locally to update package-lock.json
   ```

3. **Prisma Client Not Generated**
   ```
   Fix: Ensure "prisma generate" in build script
   Check postinstall script runs
   ```

4. **Environment Variables Missing**
   ```
   Fix: Add required env vars in Vercel dashboard
   Redeploy after adding
   ```

### Runtime Errors

**Common Issues:**

1. **Database Connection Fails**
   ```
   Check: DATABASE_URL is correct in Vercel env vars
   Verify: Neon database is running
   Test: Connect via Prisma Studio
   ```

2. **NextAuth Errors**
   ```
   Check: NEXTAUTH_URL matches production URL
   Verify: NEXTAUTH_SECRET is set
   Ensure: Callbacks configured correctly
   ```

3. **API Routes Timeout**
   ```
   Check: Database queries are optimized
   Add: Indexes for slow queries
   Reduce: Number of includes in Prisma queries
   ```

### Rollback Deployment

```bash
# Via Vercel Dashboard
Deployments → Previous Deployment → Promote to Production

# Via CLI
vercel rollback [deployment-url]
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Environment variables set correctly
- [ ] No secrets in code (all in env vars)
- [ ] `.env` and `.env.local` in `.gitignore`
- [ ] NEXTAUTH_SECRET is strong (32+ characters)
- [ ] DATABASE_URL uses SSL (`?sslmode=require`)
- [ ] API routes validate inputs
- [ ] No console.logs with sensitive data
- [ ] CORS configured if needed
- [ ] Rate limiting considered (future)

---

## 📊 Performance Optimization

### Build Performance

**Optimize Dependencies:**
```bash
# Remove unused dependencies
npm prune

# Check bundle size
npm run build
# Review .next/analyze output
```

**Optimize Images:**
- Use Next.js Image component
- Serve WebP format
- Lazy load below fold images

### Database Performance

**Add Indexes:**
```prisma
model Project {
  // ...
  @@index([createdById])
  @@index([inviteCode])
}

model Task {
  // ...
  @@index([projectId, status])
}
```

**Optimize Queries:**
- Use `select` to limit fields
- Avoid N+1 queries (use `include`)
- Use `findUnique` instead of `findFirst` when possible

---

## 🔄 Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build

    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

---

## 📱 Edge Functions

GroupSync uses Vercel Edge Functions for API routes:

**Benefits:**
- Low latency (runs close to users)
- Automatic scaling
- Pay-per-use (free tier generous)

**Limits (Free Tier):**
- 100,000 invocations/day
- 10 second max duration
- 4.5 MB response size limit

---

## 🚀 Deployment Best Practices

### Pre-Deployment Checklist

- [ ] Run all tests locally
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Test in dev mode (`npm run dev`)
- [ ] Review changed files
- [ ] Update documentation if needed
- [ ] Commit message follows convention

### Post-Deployment Verification

- [ ] Check Vercel deployment status (green check)
- [ ] Visit production URL
- [ ] Test critical user flows:
  - Login/signup
  - Create project
  - Add tasks
  - Submit availability
- [ ] Check for console errors
- [ ] Verify database connections
- [ ] Monitor logs for errors (first 5 minutes)

---

## 📞 Support & Resources

**Vercel:**
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Support: https://vercel.com/support

**Neon:**
- Dashboard: https://console.neon.tech
- Docs: https://neon.tech/docs
- Support: https://neon.tech/docs/introduction/support

**Next.js:**
- Deployment Docs: https://nextjs.org/docs/deployment

---

**Created:** 2026-02-14
**Last Updated:** 2026-02-14
**Maintained By:** GroupSync Team
