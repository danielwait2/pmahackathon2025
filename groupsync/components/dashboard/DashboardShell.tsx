'use client';

import { useState } from 'react';
import { LogOut, Plus, UserPlus } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

import { CreateProjectWizard } from '@/components/dashboard/CreateProjectWizard';
import { JoinProjectModal } from '@/components/dashboard/JoinProjectModal';
import { MyTasksPanel } from '@/components/dashboard/MyTasksPanel';
import { ProjectList } from '@/components/dashboard/ProjectList';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DashboardAssignedTask, DashboardProject } from '@/types';

interface DashboardShellProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  projects: DashboardProject[];
  myTasks: DashboardAssignedTask[];
}

function getInitials(nameOrEmail: string) {
  return nameOrEmail
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function DashboardShell({ userName, userEmail, userAvatarUrl, projects, myTasks }: DashboardShellProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/login' });
    } catch {
      toast.error('Unable to log out right now.');
      setLoggingOut(false);
    }
  };

  return (
    <>
      <OnboardingTour />
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

        <section>
          <MyTasksPanel tasks={myTasks} />
        </section>
      </div>

      <CreateProjectWizard open={createOpen} onOpenChange={setCreateOpen} />
      <JoinProjectModal open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
