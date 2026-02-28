'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface AccountPrivacyToggleProps {
  initialIsPublic: boolean;
}

export function AccountPrivacyToggle({ initialIsPublic }: AccountPrivacyToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  const updateVisibility = async (nextIsPublic: boolean) => {
    if (saving || nextIsPublic === isPublic) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to update profile visibility.');
        return;
      }
      setIsPublic(nextIsPublic);
      toast.success(nextIsPublic ? 'Profile set to public.' : 'Profile set to private.');
    } catch {
      toast.error('Unable to update profile visibility.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Profile visibility</p>
      <p className="mt-1 text-xs text-slate-600">
        {isPublic
          ? 'Public: your name and email can appear in add-member search.'
          : "Private: you won't appear in public search, but can still be invited by email."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button variant={isPublic ? 'outline' : 'default'} size="sm" disabled={saving} onClick={() => updateVisibility(false)}>
          Private
        </Button>
        <Button variant={isPublic ? 'default' : 'outline'} size="sm" disabled={saving} onClick={() => updateVisibility(true)}>
          Public
        </Button>
      </div>
    </div>
  );
}
