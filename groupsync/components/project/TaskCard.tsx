'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { format, isPast } from 'date-fns';
import { GripVertical } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  assigneeName: string | null;
  onClick: () => void;
}

export function TaskCard({ task, assigneeName, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `task-${task.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = Boolean(task.due_date && isPast(new Date(task.due_date)) && task.status !== 'done');

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={`w-full rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm transition ${
        isDragging ? 'opacity-70' : 'hover:shadow'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="line-clamp-2 font-semibold text-slate-900">{task.title}</p>
          <p className="text-xs text-slate-500">{assigneeName ?? 'Unassigned'}</p>
        </div>
        <span
          className="cursor-grab text-slate-400"
          onPointerDown={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {task.due_date && (
          <Badge variant={overdue ? 'destructive' : 'outline'}>
            {overdue ? 'Overdue' : `Due ${format(new Date(task.due_date), 'MMM d')}`}
          </Badge>
        )}
      </div>
    </button>
  );
}
