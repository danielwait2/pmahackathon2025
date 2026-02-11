import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DashboardProject, ProjectMemberPreview } from '@/types';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  deadline: string | null;
  created_by: string;
  invite_code: string;
  created_at: string;
}

interface TaskRow {
  project_id: string;
  status: 'todo' | 'in_progress' | 'done';
}

interface ProjectMemberRow {
  project_id: string;
  user_id: string;
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: profile }, { data: membershipRows }] = await Promise.all([
    supabase.from('profiles').select('name, avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('project_members').select('project_id').eq('user_id', user.id),
  ]);

  const projectIds = (membershipRows ?? []).map((row) => row.project_id);

  let projects: DashboardProject[] = [];
  if (projectIds.length > 0) {
    const [{ data: projectRows }, { data: taskRows }, { data: memberRows }] = await Promise.all([
      supabase.from('projects').select('*').in('id', projectIds).order('created_at', { ascending: false }),
      supabase.from('tasks').select('project_id, status').in('project_id', projectIds),
      supabase
        .from('project_members')
        .select('project_id, user_id, profiles(id, name, avatar_url)')
        .in('project_id', projectIds),
    ]);

    const tasksByProject = (taskRows as TaskRow[] | null)?.reduce<Record<string, TaskRow[]>>((acc, task) => {
      acc[task.project_id] = [...(acc[task.project_id] ?? []), task];
      return acc;
    }, {}) ?? {};

    const membersByProject =
      (memberRows as ProjectMemberRow[] | null)?.reduce<Record<string, ProjectMemberPreview[]>>((acc, member) => {
        if (!acc[member.project_id]) {
          acc[member.project_id] = [];
        }
        if (member.profiles) {
          acc[member.project_id].push(member.profiles);
        }
        return acc;
      }, {}) ?? {};

    projects = ((projectRows as ProjectRow[] | null) ?? []).map((project) => {
      const memberList = membersByProject[project.id] ?? [];
      const taskList = tasksByProject[project.id] ?? [];
      const completedTasks = taskList.filter((task) => task.status === 'done').length;
      return {
        ...project,
        member_count: memberList.length,
        members: memberList,
        total_tasks: taskList.length,
        completed_tasks: completedTasks,
      };
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardShell
          userName={profile?.name ?? user.email ?? 'GroupSync User'}
          userEmail={user.email ?? ''}
          userAvatarUrl={profile?.avatar_url ?? null}
          projects={projects}
        />
      </div>
    </main>
  );
}
