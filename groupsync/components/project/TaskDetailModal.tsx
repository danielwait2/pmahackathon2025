'use client';

import { format } from 'date-fns';
import { Calendar, CheckCircle2, CircleDashed, LoaderCircle, Trash2, User, Edit } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  assigneeName: string | null;
  createdAt: string;
}

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: TaskDetail | null;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
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

export function TaskDetailModal({
  open,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskDetailModalProps) {
  if (!task) return null;

  const config = statusConfig[task.status];
  const Icon = config.icon;

  const handleStatusChange = (newStatus: 'todo' | 'in_progress' | 'done') => {
    onStatusChange?.(task.id, newStatus);
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className="flex-1 text-xl">{task.title}</DialogTitle>
            <Badge variant={config.variant} className="flex items-center gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description */}
          {task.description && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-slate-700">Description</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <Separator />

          {/* Metadata Grid */}
          <div className="grid gap-3">
            {/* Assigned To */}
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Assigned to</p>
                <p className="text-sm font-medium">{task.assigneeName || 'Unassigned'}</p>
              </div>
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Due date</p>
                  <p className="text-sm font-medium">
                    {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Created Date */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(task.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Status Change Buttons */}
          {onStatusChange && task.status !== 'done' && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-medium text-slate-700">Change Status</h4>
                <div className="flex gap-2">
                  {task.status !== 'in_progress' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange('in_progress')}
                    >
                      <LoaderCircle className="h-3 w-3 mr-1" />
                      Start Task
                    </Button>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleStatusChange('done')}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Mark Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(task.id)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
