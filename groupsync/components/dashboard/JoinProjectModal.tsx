'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase';

interface JoinProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function normalizeCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function JoinProjectModal({ open, onOpenChange }: JoinProjectModalProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const normalizedCode = useMemo(() => normalizeCode(code), [code]);

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();

    if (normalizedCode.length !== 6) {
      toast.error('Invite code must be 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to join a project.');
        router.push('/login');
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, invite_code')
        .eq('invite_code', normalizedCode)
        .maybeSingle();

      if (projectError || !project) {
        toast.error('Invalid invite code. Check with your team.');
        return;
      }

      const { data: membership } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membership) {
        toast.info("You're already in this project.");
        onOpenChange(false);
        router.push(`/project/${project.id}`);
        return;
      }

      onOpenChange(false);
      router.push(`/join/${normalizedCode}`);
    } catch {
      toast.error('Unable to join project right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Project</DialogTitle>
          <DialogDescription>Enter the 6-character invite code from your teammate.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleJoin}>
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              value={normalizedCode}
              onChange={(event) => setCode(event.target.value)}
              className="font-mono uppercase tracking-[0.35em]"
              placeholder="ABC123"
              maxLength={6}
              disabled={loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || normalizedCode.length !== 6}>
            {loading ? 'Checking code...' : 'Join'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
