'use client';

import { DashboardProject } from '@/types';

import { EmptyState } from '@/components/dashboard/EmptyState';
import { ProjectCard } from '@/components/dashboard/ProjectCard';

interface ProjectListProps {
  projects: DashboardProject[];
  onCreateProject: () => void;
  onJoinProject: () => void;
}

export function ProjectList({ projects, onCreateProject, onJoinProject }: ProjectListProps) {
  if (!projects.length) {
    return <EmptyState onCreateProject={onCreateProject} onJoinProject={onJoinProject} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
