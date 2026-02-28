'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface SearchUser {
  id: string;
  name: string;
  email: string;
}

interface RecentCollaborator {
  id: string;
  name: string;
  email: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onInviteSent: (userId: string) => void;
  pendingRequestUserIds: string[];
  existingMemberUserIds: string[];
  recentCollaborators: RecentCollaborator[];
}

export function AddMemberDialog({
  open,
  onOpenChange,
  projectId,
  onInviteSent,
  pendingRequestUserIds,
  existingMemberUserIds,
  recentCollaborators,
}: AddMemberDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSearching(false);
      return;
    }

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?query=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? 'Unable to search users.');
          return;
        }
        const data: SearchUser[] = await res.json();
        setResults(data);
      } catch {
        toast.error('Unable to search users.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [open, query]);

  const inviteUser = async (toUserId: string) => {
    setInvitingUserId(toUserId);
    try {
      const res = await fetch(`/api/projects/${projectId}/member-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to send invite.');
        return;
      }
      onInviteSent(toUserId);
      toast.success('Invite sent.');
    } catch {
      toast.error('Unable to send invite.');
    } finally {
      setInvitingUserId(null);
    }
  };

  const disabledUserIds = useMemo(() => {
    return new Set([...pendingRequestUserIds, ...existingMemberUserIds]);
  }, [pendingRequestUserIds, existingMemberUserIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {recentCollaborators.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent collaborators</p>
              <div className="flex flex-wrap gap-2">
                {recentCollaborators.map((user) => {
                  const disabled = disabledUserIds.has(user.id);
                  return (
                    <Button
                      key={user.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled || invitingUserId === user.id}
                      onClick={() => inviteUser(user.id)}
                    >
                      {user.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
            />
            {searching && <p className="text-xs text-slate-500">Searching...</p>}
            {!searching && query.trim().length >= 2 && results.length === 0 && (
              <p className="text-xs text-slate-500">No users found.</p>
            )}
            <div className="space-y-2">
              {results.map((user) => {
                const alreadyPending = pendingRequestUserIds.includes(user.id);
                const alreadyMember = existingMemberUserIds.includes(user.id);
                const disabled = alreadyPending || alreadyMember;
                return (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-600">{user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={disabled ? 'outline' : 'default'}
                      disabled={disabled || invitingUserId === user.id}
                      onClick={() => inviteUser(user.id)}
                    >
                      {alreadyMember ? 'Member' : alreadyPending ? 'Requested' : 'Invite'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
