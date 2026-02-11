# Phase 2: Landing Page

> **Time Estimate:** 1 hour
> **Priority:** MUST
> **Prerequisites:** Phase 0 complete (Phase 1 not strictly required for this)
> **Rubric:** Problem Definition (survey stats), Design & UX (professional first impression), Presentation (judges see this first)

---

## Goal

Build a compelling, mobile-responsive landing page that communicates the problem, showcases survey data, and drives users to sign up.

---

## Design Specifications

- **Color scheme:** Blue primary (`#2563EB` / Tailwind `blue-600`), green accents (`#10B981` / `emerald-500`)
- **Typography:** System font stack (Inter if available), large headings, generous whitespace
- **Layout:** Single-page scroll with distinct sections
- **Mobile-first:** Stack everything vertically on small screens, expand on desktop

---

## Steps

### 2.1 Hero Section

**Component:** `components/landing/HeroSection.tsx`

Content:
- **Headline:** "Stop fighting schedules. Start building together."
- **Subheadline:** "GroupSync helps student teams align schedules, set expectations, and track progress — in under 2 minutes."
- **CTA Buttons:**
  - Primary: "Get Started Free" → links to `/signup`
  - Secondary/outline: "Join a Project" → links to `/login` (they'll enter invite code from dashboard)
- **Visual:** Abstract illustration area or a styled mockup preview of the dashboard (can use a gradient placeholder box with rounded corners to simulate an app screenshot)

Layout:
- Desktop: Two columns — text left, visual right
- Mobile: Stack — text on top, visual below

### 2.2 Problem Section

**Component:** `components/landing/ProblemSection.tsx`

Content:
- **Title:** "Group projects shouldn't be this hard"
- **3 stat cards** in a row (stack on mobile):

| Icon | Stat | Description |
|---|---|---|
| Calendar/Clock icon | **39%** | "say scheduling is their biggest frustration" |
| Users icon | **68%** | "would use a tool that makes collaboration smoother" |
| AlertTriangle icon | **Hours wasted** | "Students spend more time coordinating than creating" |

- Add a subtle note: *"Based on survey of 31 university students"* to show real research

Design:
- Light gray background section to break visual flow
- Cards should have a large bold stat number, then description below
- Icons from Lucide React

### 2.3 Solution Section

**Component:** `components/landing/SolutionSection.tsx`

Content:
- **Title:** "Everything your team needs in one place"
- **4 feature cards** in a 2x2 grid (stack on mobile):

| Icon | Feature | Description |
|---|---|---|
| Calendar | **Smart Scheduling** | "Find times that work for everyone with visual availability overlap" |
| CheckSquare | **Task Clarity** | "Know who's doing what and when with kanban boards and assignments" |
| Handshake | **Team Agreements** | "Set expectations upfront so everyone's aligned from day one" |
| Sparkles | **AI-Powered** | "Get task suggestions tailored to your project type and deadline" |

Design:
- White background
- Cards with subtle border, icon at top, title bold, description muted
- Hover effect: slight shadow lift

### 2.4 How It Works Section

**Component:** `components/landing/HowItWorksSection.tsx`

Content:
- **Title:** "Up and running in 3 steps"
- **3 numbered steps** with connecting visual (dotted line or arrow):

1. **Create your project** (30 seconds) — "Name it, set a deadline, choose your communication preferences"
2. **Invite your team** (share a link) — "Send a 6-character code or shareable link to your teammates"
3. **Align and build** — "Set availability, manage tasks, and agree on expectations together"

Design:
- Desktop: Horizontal 3-column with numbered circles (1, 2, 3)
- Mobile: Vertical stack with numbers on left
- Light background section

### 2.5 Final CTA Section

**Component:** `components/landing/CTASection.tsx`

Content:
- **Headline:** "Ready to make group work actually work?"
- **Large CTA button:** "Create Your First Project" → `/signup`
- Optional: small text below "Free for students. No credit card needed."

Design:
- Blue gradient background (`blue-600` to `blue-700`)
- White text
- Centered layout
- Generous padding top and bottom

### 2.6 Assemble Landing Page

**`app/page.tsx`:**

```tsx
import { HeroSection } from '@/components/landing/HeroSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionSection } from '@/components/landing/SolutionSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <CTASection />
    </main>
  );
}
```

### 2.7 Add Simple Navigation

Add a minimal nav bar at the top of the landing page:
- Left: "GroupSync" logo text (bold, blue-600)
- Right: "Log In" link and "Get Started" button
- Sticky on scroll (optional but nice)
- On mobile: just logo + "Get Started" button

### 2.8 Test & Verify

1. `npm run dev` → navigate to `localhost:3000`
2. Check each section renders correctly
3. Test at mobile width (375px) in browser dev tools
4. Test at tablet width (768px)
5. Test at desktop width (1280px+)
6. Click all CTA buttons — verify they navigate correctly
7. Check no horizontal scroll on mobile (common issue)

---

## Checklist

- [x] `components/landing/HeroSection.tsx` — renders with headline, subheadline, CTAs
- [x] `components/landing/ProblemSection.tsx` — 3 stat cards with survey data
- [x] `components/landing/SolutionSection.tsx` — 4 feature cards
- [x] `components/landing/HowItWorksSection.tsx` — 3 steps
- [x] `components/landing/CTASection.tsx` — final call to action
- [x] `app/page.tsx` — assembles all sections
- [x] Navigation bar with logo, login, get started
- [x] Survey attribution text present ("Based on survey of 31 students")
- [x] All CTA buttons link to correct routes (/signup, /login)
- [ ] Mobile responsive (375px) — no horizontal scroll, stacked layout
- [ ] Tablet responsive (768px) — reasonable layout
- [ ] Desktop (1280px+) — full layout with columns
- [x] Color scheme matches spec (blue-600 primary, emerald-500 accents)
- [ ] No console errors

---

## Next Phase

When all items are checked, proceed to [Phase 3: Dashboard & Project Creation](phase-3-dashboard.md).


