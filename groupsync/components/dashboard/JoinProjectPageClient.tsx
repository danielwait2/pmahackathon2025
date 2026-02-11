'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface JoinProjectPageClientProps {
  code: string;
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  creatorName: string | null;
  memberCount: number;
}

export function JoinProjectPageClient({
  code,
  projectId,
  projectName,
  projectDescription,
  creatorName,
  memberCount,
}: JoinProjectPageClientProps) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch('/api/projects/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Unable to join project.');
        return;
      }

      toast.success(data.alreadyMember ? 'You are already in this project.' : `Joined ${projectName}.`);
      router.push(`/project/${projectId}`);
      router.refresh();
    } catch {
      toast.error('Unable to join project right now.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Join {projectName}</CardTitle>
        <CardDescription>Invite code: {code}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-slate-600">
        {projectDescription ? <p>{projectDescription}</p> : null}
        <p>Created by: {creatorName ?? 'Unknown teammate'}</p>
        <p>{memberCount} member{memberCount === 1 ? '' : 's'} currently in this project.</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining...' : 'Join this project'}
        </Button>
      </CardFooter>
    </Card>
  );
}
