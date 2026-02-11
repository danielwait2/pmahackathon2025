'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, Clock3, ListChecks } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardAssignedTask } from '@/types';

interface MyTasksPanelProps {
  tasks: DashboardAssignedTask[];
}

type FilterMode = 'open' | 'all';

function formatDueDate(value: string | null) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function MyTasksPanel({ tasks }: MyTasksPanelProps) {
  const [mode, setMode] = useState<FilterMode>('open');

  const filtered = useMemo(() => {
    if (mode === 'all') return tasks;
    return tasks.filter((task) => task.status !== 'done');
  }, [tasks, mode]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-xl">My Tasks</CardTitle>
        <Badge variant="outline">{filtered.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button size="sm" variant={mode === 'open' ? 'default' : 'outline'} onClick={() => setMode('open')}>
            Open
          </Button>
          <Button size="sm" variant={mode === 'all' ? 'default' : 'outline'} onClick={() => setMode('all')}>
            All
          </Button>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <ListChecks className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-2 text-sm font-medium text-slate-900">No tasks assigned yet</p>
            <p className="mt-1 text-xs text-slate-500">Assigned tasks from all your projects will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <Link
                key={task.id}
                href={`/project/${task.projectId}?tab=tasks`}
                className="block rounded-md border border-slate-200 bg-white p-3 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.projectName}</p>
                  </div>
                  <Badge variant={task.status === 'done' ? 'secondary' : 'outline'}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDueDate(task.dueDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {task.status === 'done' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    {task.status === 'done' ? 'Complete' : 'Needs action'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
