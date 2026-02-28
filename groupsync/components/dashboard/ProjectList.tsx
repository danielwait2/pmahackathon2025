'use client';

import { DashboardProject } from '@/types';

import { EmptyState } from '@/components/dashboard/EmptyState';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

interface ProjectListProps {
  projects: DashboardProject[];
  currentUserId: string;
  emptyStateMode?: 'active' | 'archived';
  onCreateProject: () => void;
  onJoinProject: () => void;
}

export function ProjectList({
  projects,
  currentUserId,
  emptyStateMode = 'active',
  onCreateProject,
  onJoinProject,
}: ProjectListProps) {
  if (!projects.length) {
    if (emptyStateMode === 'archived') {
      return <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No completed projects yet.</p>;
    }
    return <EmptyState onCreateProject={onCreateProject} onJoinProject={onJoinProject} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
