# Phase 7: Deployment

> **Time Estimate:** 30 minutes
> **Priority:** MUST
> **Prerequisites:** All prior phases complete (at minimum Phases 0-4)
> **Rubric:** Presentation (live demo URL for judges)

---

## Goal

Deploy GroupSync to Vercel with a production URL that judges can visit. Ensure all features work in production.

---

## Steps

### 7.1 Pre-Deployment Checks

Before deploying, verify locally:

```bash
# Build the project (catches TypeScript/build errors)
npm run build

# Test the production build locally
npm start
# Visit localhost:3000 and quick-test key flows
```

Fix any build errors before proceeding.

### 7.2 Set Up Vercel

**Option A: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No (first time)
# - Project name: groupsync
# - Directory: ./
# - Override settings? No
```

**Option B: Vercel Dashboard (easier)**

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Framework preset: Next.js (auto-detected)
6. Click "Deploy"

### 7.3 Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

| Key | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `GEMINI_API_KEY` | Your Gemini API key | Production, Preview, Development |

After adding variables, **redeploy** (Deployments tab → click latest → Redeploy).

### 7.4 Configure Supabase for Production

In Supabase Dashboard:

1. **Authentication → URL Configuration:**
   - Add your Vercel production URL to "Redirect URLs": `https://your-app.vercel.app/**`
   - This allows auth redirects to work in production

2. **Authentication → Rate Limits:**
   - Review default rate limits are reasonable for demo

3. **Check RLS policies are enabled** (they should be from Phase 1)

### 7.5 Post-Deployment Verification

Visit your production URL and test:

1. [ ] Landing page loads correctly (all sections, images, styles)
2. [ ] Sign up works → creates user + profile
3. [ ] Login works → redirects to dashboard
4. [ ] Create project → invite code generated
5. [ ] Copy invite link → works with production domain
6. [ ] Join project via invite link (test in incognito)
7. [ ] Availability grid saves and loads
8. [ ] Team availability shows overlap
9. [ ] Task board displays, drag-and-drop works
10. [ ] AI suggestions work (if Gemini key set)
11. [ ] Team agreement creates and "I Agree" works
12. [ ] Mobile responsive (test on actual phone)
13. [ ] No console errors
14. [ ] HTTPS working (Vercel handles this automatically)

### 7.6 Custom Domain (Optional)

If you have a custom domain:
```
Vercel Dashboard → Settings → Domains → Add
```
Follow Vercel's DNS configuration instructions.

### 7.7 Record Backup Demo Video

In case of live demo issues (WiFi, Supabase outage, etc.):

1. Screen record a full walkthrough of the app (2-3 minutes)
2. Cover all key flows: landing → signup → create project → invite → availability → tasks → team agreement
3. Show mobile view briefly
4. Save the video locally and optionally upload to Google Drive
5. Have this ready as a backup during presentation

### 7.8 Prepare Submission

Gather these for hackathon submission:
- [ ] Production URL
- [ ] GitHub repository URL (make sure it's public or share access)
- [ ] Brief description (2-3 sentences)
- [ ] Screenshots (landing page, dashboard, project view, mobile)
- [ ] Team member names
- [ ] Backup demo video link

---

## Checklist

- [ ] `npm run build` succeeds with no errors
- [ ] Deployed to Vercel
- [ ] Environment variables set in Vercel dashboard
- [ ] Supabase redirect URL configured for production domain
- [ ] Production URL loads landing page
- [ ] Auth flow works in production (signup + login)
- [ ] Project creation works in production
- [ ] Invite links work with production domain
- [ ] All features functional in production
- [ ] Mobile responsive in production
- [ ] No console errors in production
- [ ] Backup demo video recorded
- [ ] Submission materials gathered (URL, repo, description, screenshots)

---

## Done!

If you've made it here with all checkboxes checked, GroupSync is live and ready for the hackathon demo. Good luck!

Go back to the [Master Plan](PLAN.md) to review the presentation talking points.
