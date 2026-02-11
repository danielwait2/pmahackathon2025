import { notFound, redirect } from 'next/navigation';

import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectTabs } from '@/components/project/ProjectTabs';
import { createServerSupabaseClient } from '@/lib/supabase';
import { Availability, Project, ProjectMember, Task, TeamAgreement } from '@/types';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

interface MemberRow extends ProjectMember {
  profiles: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select('id, role')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const [{ data: project }, { data: memberRows }, { data: tasks }, { data: availability }, { data: teamAgreement }] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).maybeSingle(),
    supabase.from('project_members').select('*, profiles(id, name, avatar_url)').eq('project_id', id),
    supabase.from('tasks').select('*').eq('project_id', id).order('order_index', { ascending: true }),
    supabase.from('availability').select('*').eq('project_id', id),
    supabase.from('team_agreements').select('*').eq('project_id', id).maybeSingle(),
  ]);

  if (!project) {
    notFound();
  }

  const members = ((memberRows as MemberRow[] | null) ?? [])
    .filter((row) => row.profiles)
    .map((row) => ({
      ...row,
      profile: row.profiles!,
    }));

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <ProjectHeader project={project as Project} isOwner={membership.role === 'owner'} />
        <ProjectTabs
          project={project as Project}
          members={members}
          tasks={(tasks as Task[] | null) ?? []}
          availability={(availability as Availability[] | null) ?? []}
          teamAgreement={(teamAgreement as TeamAgreement | null) ?? null}
          currentUserId={user.id}
          isOwner={membership.role === 'owner'}
        />
      </div>
    </main>
  );
}
