import { format } from 'date-fns';
import { CheckCircle2, CircleDashed, LoaderCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ProjectTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  assigneeName: string | null;
}

interface TasksTabProps {
  tasks: ProjectTaskItem[];
}

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const statusIcons = {
  todo: CircleDashed,
  in_progress: LoaderCircle,
  done: CheckCircle2,
};

const columns: Array<'todo' | 'in_progress' | 'done'> = ['todo', 'in_progress', 'done'];

export function TasksTab({ tasks }: TasksTabProps) {
  const grouped = columns.map((status) => ({
    status,
    items: tasks.filter((task) => task.status === status),
  }));

  if (!tasks.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-600">
          No tasks yet. Task creation APIs are now in place, so you can wire add/edit UI next.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {grouped.map(({ status, items }) => {
        const Icon = statusIcons[status];
        return (
          <Card key={status}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {statusLabels[status]}
                </span>
                <Badge variant="outline">{items.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks</p>
              ) : (
                items.map((task) => (
                  <div key={task.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>{task.assigneeName ?? 'Unassigned'}</span>
                      <span>
                        {task.dueDate ? `Due ${format(new Date(task.dueDate), 'MMM d, yyyy')}` : 'No due date'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
