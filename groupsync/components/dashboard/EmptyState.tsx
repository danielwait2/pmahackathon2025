'use client';

import { FolderOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateProject: () => void;
  onJoinProject: () => void;
}

export function EmptyState({ onCreateProject, onJoinProject }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <FolderOpen className="mx-auto h-14 w-14 text-blue-600" />
      <h2 className="mt-4 text-2xl font-bold text-slate-900">No projects yet</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        Create your first project or join one with an invite code.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={onCreateProject}>Create Project</Button>
        <Button variant="outline" onClick={onJoinProject}>
          Join Project
        </Button>
      </div>
    </div>
  );
}
