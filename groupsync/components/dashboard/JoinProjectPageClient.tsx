'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';

interface JoinProjectPageClientProps {
  code: string;
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  creatorName: string | null;
  memberCount: number;
  isAuthenticated: boolean;
  isAlreadyMember: boolean;
}

export function JoinProjectPageClient({
  code,
  projectId,
  projectName,
  projectDescription,
  creatorName,
  memberCount,
  isAuthenticated,
  isAlreadyMember,
}: JoinProjectPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !isAlreadyMember || redirectedRef.current) {
      return;
    }

    redirectedRef.current = true;
    toast.info("You're already in this project.");
    router.replace(`/project/${projectId}`);
  }, [isAlreadyMember, isAuthenticated, projectId, router]);

  const joinProject = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/login?redirect=/join/${code}`);
        return;
      }

      const { error: memberError } = await supabase.from('project_members').insert({
        project_id: projectId,
        user_id: user.id,
        role: 'member',
      });

      if (memberError) {
        if (memberError.message.toLowerCase().includes('duplicate')) {
          router.push(`/project/${projectId}`);
          return;
        }
        toast.error(memberError.message);
        return;
      }

      await supabase.from('availability').upsert({
        project_id: projectId,
        user_id: user.id,
        slots: [],
      });

      toast.success(`Welcome to ${projectName}!`);
      router.push(`/project/${projectId}`);
      router.refresh();
    } catch {
      toast.error('Unable to join project right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
        <Card className="w-full border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl">Join Project</CardTitle>
            <CardDescription>Invite code: {code}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Project</p>
              <p className="text-xl font-bold text-slate-900">{projectName}</p>
            </div>
            {projectDescription && <p className="text-slate-600">{projectDescription}</p>}
            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              <span>Created by {creatorName ?? 'a teammate'}</span>
              <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
            {!isAuthenticated && (
              <>
                <Button asChild variant="outline">
                  <Link href={`/login?redirect=/join/${code}`}>Log in to join</Link>
                </Button>
                <Button asChild>
                  <Link href={`/signup?redirect=/join/${code}`}>Sign up</Link>
                </Button>
              </>
            )}

            {isAuthenticated && isAlreadyMember && (
              <Button onClick={() => router.push(`/project/${projectId}`)}>Go to Project</Button>
            )}

            {isAuthenticated && !isAlreadyMember && (
              <Button onClick={joinProject} disabled={loading}>
                {loading ? 'Joining...' : 'Join This Project'}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
