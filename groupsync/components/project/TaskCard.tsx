'use client';

import { format } from 'date-fns';
import { Clock, User } from 'lucide-react';

export interface TaskCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  reminderDate: string | null;
  assigneeName: string | null;
  onClick?: (taskId: string) => void;
  onDragStart?: (taskId: string) => void;
}

export function TaskCard({
  id,
  title,
  description,
  dueDate,
  reminderDate,
  assigneeName,
  onClick,
  onDragStart,
}: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    onDragStart?.(id);
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleDragStart}
      className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md cursor-move"
      onClick={() => onClick?.(id)}
    >
      {/* Card Title */}
      <h3 className="font-medium text-slate-900">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{description}</p>
      )}

      {/* Footer Metadata */}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        {assigneeName && (
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {assigneeName}
          </span>
        )}
        {dueDate && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(dueDate), 'MMM d, yyyy')}
          </span>
        )}
        {reminderDate && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Remind {format(new Date(reminderDate), 'MMM d, h:mm a')}
          </span>
        )}
      </div>
    </div>
  );
}
