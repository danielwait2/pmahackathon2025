'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface InviteItem {
  id: string;
  projectId: string;
  projectName: string;
  fromUserName: string;
  createdAt: string;
}

interface MyInvitesPanelProps {
  invites: InviteItem[];
}

export function MyInvitesPanel({ invites: initialInvites }: MyInvitesPanelProps) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);

  const handleInvite = async (inviteId: string, action: 'accept' | 'decline') => {
    setLoadingInviteId(inviteId);
    try {
      const res = await fetch(`/api/user/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to update invite.');
        return;
      }
      setInvites((current) => current.filter((invite) => invite.id !== inviteId));
      toast.success(action === 'accept' ? 'Invite accepted.' : 'Invite declined.');
      router.refresh();
    } catch {
      toast.error('Unable to update invite.');
    } finally {
      setLoadingInviteId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">My Invites</h2>
      {invites.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No pending invites.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-medium text-slate-900">{invite.projectName}</p>
              <p className="mt-1 text-xs text-slate-600">
                Invited by {invite.fromUserName} {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  disabled={loadingInviteId === invite.id}
                  onClick={() => handleInvite(invite.id, 'accept')}
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingInviteId === invite.id}
                  onClick={() => handleInvite(invite.id, 'decline')}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
