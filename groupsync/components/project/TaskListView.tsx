'use client';

import { format } from 'date-fns';
import { CheckCircle2, CircleDashed, Clock, LoaderCircle, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export interface TaskListItem {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  assigneeName: string | null;
}

interface TaskListViewProps {
  tasks: TaskListItem[];
  onTaskClick?: (taskId: string) => void;
}

const statusConfig = {
  todo: {
    label: 'To Do',
    icon: CircleDashed,
    variant: 'secondary' as const,
  },
  in_progress: {
    label: 'In Progress',
    icon: LoaderCircle,
    variant: 'default' as const,
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    variant: 'outline' as const,
  },
};

export function TaskListView({ tasks, onTaskClick }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-slate-600">
          No tasks yet. Add your first task to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const config = statusConfig[task.status];
        const Icon = config.icon;

        return (
          <Card
            key={task.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => onTaskClick?.(task.id)}
          >
            <CardContent className="p-4">
              {/* Header with Title and Status */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex-1 font-medium text-slate-900">{task.title}</h3>
                <Badge variant={config.variant} className="flex items-center gap-1 whitespace-nowrap">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>

              {/* Description */}
              {task.description && (
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{task.description}</p>
              )}

              {/* Metadata Footer */}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                {task.assigneeName && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {task.assigneeName}
                  </span>
                )}
                {task.dueDate && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
