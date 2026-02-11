'use client';

import { format, isPast } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';

interface TaskListViewProps {
  tasks: Task[];
  assigneeMap: Record<string, string>;
  onOpenTask: (task: Task) => void;
  onToggleDone: (task: Task) => Promise<void>;
}

const GROUPS: Array<{ key: Task['status']; label: string }> = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export function TaskListView({ tasks, assigneeMap, onOpenTask, onToggleDone }: TaskListViewProps) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => {
        const groupTasks = tasks.filter((task) => task.status === group.key);
        return (
          <div key={group.key} className="rounded-lg border border-slate-200 bg-white p-3">
            <h3 className="mb-3 font-semibold text-slate-900">{group.label}</h3>
            <div className="space-y-2">
              {groupTasks.length === 0 && <p className="text-sm text-slate-500">No tasks in this section.</p>}
              {groupTasks.map((task) => {
                const overdue = Boolean(task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done');
                return (
                  <div key={task.id} className="flex items-center gap-2 rounded-md border border-slate-100 p-2">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => onToggleDone(task)}
                      aria-label={`Mark ${task.title} done`}
                    />
                    <button type="button" className="flex-1 text-left" onClick={() => onOpenTask(task)}>
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.assigned_to ? assigneeMap[task.assigned_to] : 'Unassigned'}</p>
                    </button>
                    {task.due_date && (
                      <Badge variant={overdue ? 'destructive' : 'outline'}>{format(new Date(task.due_date), 'MMM d')}</Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => onOpenTask(task)}>
                      Edit
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
