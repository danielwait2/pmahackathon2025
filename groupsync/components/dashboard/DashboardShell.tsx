'use client';

import { useState } from 'react';
import { LogOut, Plus, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CreateProjectWizard } from '@/components/dashboard/CreateProjectWizard';
import { JoinProjectModal } from '@/components/dashboard/JoinProjectModal';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase';
import { DashboardProject } from '@/types';

interface DashboardShellProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  projects: DashboardProject[];
}

function getInitials(nameOrEmail: string) {
  return nameOrEmail
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function DashboardShell({ userName, userEmail, userAvatarUrl, projects }: DashboardShellProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Unable to log out right now.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={userAvatarUrl ?? undefined} alt={userName} />
              <AvatarFallback>{getInitials(userName || userEmail)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-slate-900">{userName}</p>
              <p className="text-sm text-slate-500">{userEmail}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
            <Button variant="outline" onClick={() => setJoinOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Join Project
            </Button>
            <Button variant="ghost" onClick={handleLogout} disabled={loggingOut}>
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </header>

        <section className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Your Projects</h1>
          <ProjectList projects={projects} onCreateProject={() => setCreateOpen(true)} onJoinProject={() => setJoinOpen(true)} />
        </section>
      </div>

      <CreateProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
      <JoinProjectModal open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
