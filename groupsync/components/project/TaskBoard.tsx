'use client';

import { useState } from 'react';
import { CheckCircle2, CircleDashed, LoaderCircle, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard, type TaskCardProps } from './TaskCard';

export interface TaskBoardTask {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  assigneeName: string | null;
}

interface TaskBoardProps {
  tasks: TaskBoardTask[];
  onTaskClick?: (taskId: string) => void;
  onAddTask?: (status: 'todo' | 'in_progress' | 'done') => void;
  onTaskMove?: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

const statusConfig = {
  todo: {
    label: 'To Do',
    icon: CircleDashed,
    color: 'text-slate-600',
  },
  in_progress: {
    label: 'In Progress',
    icon: LoaderCircle,
    color: 'text-blue-600',
  },
  done: {
    label: 'Done',
    icon: CheckCircle2,
    color: 'text-green-600',
  },
} as const;

const columns: Array<'todo' | 'in_progress' | 'done'> = ['todo', 'in_progress', 'done'];

export function TaskBoard({ tasks, onTaskClick, onAddTask, onTaskMove }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const groupedTasks = columns.map((status) => ({
    status,
    tasks: tasks.filter((task) => task.status === status),
  }));

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'done') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');

    if (taskId && onTaskMove) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== targetStatus) {
        onTaskMove(taskId, targetStatus);
      }
    }

    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {groupedTasks.map(({ status, tasks: columnTasks }) => {
        const config = statusConfig[status];
        const Icon = config.icon;

        const isDropTarget = dragOverColumn === status;

        return (
          <Card key={status} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className={`inline-flex items-center gap-2 ${config.color}`}>
                  <Icon className="h-4 w-4" />
                  {config.label}
                </span>
                <Badge variant="outline">{columnTasks.length}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent
              className={`flex-1 space-y-3 transition-colors ${
                isDropTarget ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-slate-500">No tasks</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    id={task.id}
                    title={task.title}
                    description={task.description}
                    status={task.status}
                    dueDate={task.dueDate}
                    assigneeName={task.assigneeName}
                    onClick={onTaskClick}
                    onDragStart={onTaskMove ? handleDragStart : undefined}
                  />
                ))
              )}

              {/* Add Task Button */}
              {onAddTask && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => onAddTask(status)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add task
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
