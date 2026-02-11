# Phase 5: Team Agreement Feature

> **Time Estimate:** 1.5 hours
> **Priority:** SHOULD (differentiator feature)
> **Prerequisites:** Phase 1 + Phase 3 complete, Phase 4 Team tab stub exists
> **Rubric:** Creativity (unique feature not in existing tools), Problem Definition (addresses "expectations" pain point from survey)

---

## Goal

Build the Team Agreement "expectation contract" feature — the differentiator that sets GroupSync apart from existing tools like When2Meet or Trello. Survey data showed students want expectations set upfront; no existing tool does this.

---

## Why This Feature Matters for Judges

- **Not found in existing tools** — Trello, Notion, When2Meet, Google Docs — none have a team expectations agreement
- **Directly addresses survey insight** — students want clarity on response times, meeting frequency, communication channels
- **Creates accountability** without being heavy-handed — "I Agree" is soft commitment
- **Visual progress** toward team alignment is satisfying and demo-friendly

---

## Steps

### 5.1 Team Tab Layout

**`components/project/TeamTab.tsx`** — Client Component

Two main sections:

**Section 1: Team Members**
- List of members with:
  - Avatar (or initials circle if no avatar)
  - Name
  - Role badge: "Owner" (blue) or "Member" (gray)
  - Joined date (relative: "Joined 2 days ago")
- Owner shown first, then members sorted by join date
- Invite link at bottom: "Invite more teammates" with copy button

**Section 2: Team Agreement**
- `<TeamAgreement />` component (see below)
- If no agreement exists yet:
  - Owner sees: "Set expectations for your team" + "Create Agreement" button
  - Members see: "Your team lead hasn't set expectations yet"

### 5.2 Team Agreement Display

**`components/project/TeamAgreement.tsx`** — Client Component

Card that shows the current agreement in a clean, readable format:

**Agreement fields displayed as key-value rows:**

| Label | Value | Icon |
|---|---|---|
| Response Time | "Respond within 24 hours" | Clock icon |
| Meeting Frequency | "Meet twice a week" | Calendar icon |
| Communication | "Communicate via Discord" | MessageSquare icon |
| Quality Standards | Custom text from owner | CheckCircle icon |

**Agreement status section:**

Show progress toward full team alignment:

- Progress bar: X of Y members agreed
- List of members with status:
  - Checkmark (green) + name = agreed
  - Empty circle + name = hasn't agreed yet
- **If all agreed:** prominent green badge "Team Aligned" with check icon
- **If not all agreed:** amber badge "X of Y Aligned"

**Actions:**
- **Owner sees:** "Edit Agreement" button → opens `<TeamAgreementEditor />`
- **Members who haven't agreed see:** "I Agree to These Expectations" button
- **Members who already agreed see:** Checkmark + "You've agreed" (disabled state)

### 5.3 Team Agreement Editor

**`components/project/TeamAgreementEditor.tsx`** — Client Component (Dialog)

Owner-only modal for creating/editing the agreement:

**Form fields:**

1. **Response Time** (required, select):
   - "Within 1 hour"
   - "Within 4 hours"
   - "Within 24 hours"
   - "Within 48 hours"

2. **Meeting Frequency** (required, select):
   - "Daily"
   - "Twice a week"
   - "Weekly"
   - "As needed"

3. **Communication Channel** (required, select + custom):
   - "iMessage"
   - "Discord"
   - "Slack"
   - "GroupMe"
   - "Other" → text input appears

4. **Quality Standards** (optional, textarea):
   - Placeholder: "e.g., Review each other's work before submitting, cite all sources, proofread for grammar..."
   - Max 500 characters

**Buttons:**
- "Save Agreement" — saves/updates in Supabase
- "Cancel" — closes without saving

**Important behavior on save:**
- If this is an **edit** (agreement already exists):
  - Clear the `agreed_by` array (reset all agreements)
  - Show confirmation: "Saving changes will require all team members to re-agree. Continue?"
  - Toast: "Agreement updated. Team members need to re-agree."
- If this is a **create** (first time):
  - Auto-add owner to `agreed_by` array
  - Toast: "Agreement created!"

### 5.4 Agreement Logic (Client-Side)

**"I Agree" button handler:**

```typescript
async function handleAgree(userId: string, agreement: TeamAgreement) {
  // Add user ID to agreed_by array if not already there
  const updatedAgreedBy = [...agreement.agreed_by, userId];

  await supabase
    .from('team_agreements')
    .update({ agreed_by: updatedAgreedBy })
    .eq('id', agreement.id);

  // Refresh data
  // Toast: "Thanks! You've agreed to the team expectations."
}
```

**"Edit Agreement" save handler:**

```typescript
async function handleSaveAgreement(data: Partial<TeamAgreement>) {
  // If editing existing: clear agreed_by and add owner
  const agreed_by = [currentUser.id]; // Owner auto-agrees

  await supabase
    .from('team_agreements')
    .upsert({
      project_id: projectId,
      response_time_hours: data.response_time_hours,
      meeting_frequency: data.meeting_frequency,
      communication_channel: data.communication_channel,
      quality_standards: data.quality_standards,
      agreed_by: agreed_by,
      updated_at: new Date().toISOString(),
    });
}
```

### 5.5 Real-Time Updates (Optional Enhancement)

If time allows, use Supabase Realtime to update agreement status live:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('agreement-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'team_agreements',
      filter: `project_id=eq.${projectId}`,
    }, (payload) => {
      setAgreement(payload.new as TeamAgreement);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [projectId]);
```

This means when one member clicks "I Agree", other members see the update immediately without refreshing.

---

## Checklist

- [ ] `components/project/TeamTab.tsx` — layout with members list + agreement section
- [ ] Team members list: avatar, name, role badge, join date
- [ ] Owner displayed first in member list
- [ ] Invite link shown at bottom of members list
- [ ] `components/project/TeamAgreement.tsx` — agreement display card
- [ ] Agreement shows: response time, meeting frequency, communication, quality standards
- [ ] Agreement status: progress bar showing X of Y members agreed
- [ ] Per-member agreement status: checkmark or empty circle
- [ ] "Team Aligned" green badge when all members agreed
- [ ] Owner sees "Edit Agreement" button
- [ ] Non-agreed members see "I Agree" button
- [ ] Already-agreed members see disabled "You've agreed" state
- [ ] `components/project/TeamAgreementEditor.tsx` — owner-only editor dialog
- [ ] Editor: response time dropdown
- [ ] Editor: meeting frequency dropdown
- [ ] Editor: communication channel dropdown + custom input for "Other"
- [ ] Editor: quality standards textarea
- [ ] Save creates or updates agreement in Supabase
- [ ] Edit clears agreed_by (requires re-agreement) with confirmation
- [ ] Create auto-adds owner to agreed_by
- [ ] "I Agree" adds user to agreed_by array
- [ ] Empty state: owner prompted to create, members see "waiting" message
- [ ] (Optional) Supabase Realtime for live agreement updates

---

## Next Phase

When all items are checked, proceed to [Phase 6: Polish & Demo Prep](phase-6-polish.md).
