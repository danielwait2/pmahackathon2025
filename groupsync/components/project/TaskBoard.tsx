'use client';

import { DragEndEvent, DndContext, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ClipboardList } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/types';

import { TaskCard } from '@/components/project/TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  assigneeMap: Record<string, string>;
  onStatusChange: (taskId: string, status: Task['status']) => Promise<void>;
  onOpenTask: (task: Task) => void;
  onQuickAdd: () => void;
}

const STATUS_COLUMNS: Array<{ key: Task['status']; label: string }> = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function BoardColumn({
  id,
  label,
  tasks,
  assigneeMap,
  onOpenTask,
}: {
  id: Task['status'];
  label: string;
  tasks: Task[];
  assigneeMap: Record<string, string>;
  onOpenTask: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}` });

  return (
    <div ref={setNodeRef} className={`rounded-lg border p-3 ${isOver ? 'border-blue-400 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{label}</h3>
        <Badge variant="outline">{tasks.length}</Badge>
      </div>

      <SortableContext items={tasks.map((task) => `task-${task.id}`)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={task.assigned_to ? assigneeMap[task.assigned_to] : null}
              onClick={() => onOpenTask(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({ tasks, assigneeMap, onStatusChange, onOpenTask, onQuickAdd }: TaskBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <ClipboardList className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-3 text-xl font-bold text-slate-900">No tasks yet</h3>
        <p className="mt-2 text-sm text-slate-600">
          Add your first task or use AI suggestions to generate a project plan.
        </p>
        <Button className="mt-5" onClick={onQuickAdd}>
          Add Task
        </Button>
      </div>
    );
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;

    const taskId = activeId.replace('task-', '');
    const sourceTask = tasks.find((task) => task.id === taskId);
    if (!sourceTask) return;

    let targetStatus: Task['status'] | null = null;

    if (overId.startsWith('col-')) {
      targetStatus = overId.replace('col-', '') as Task['status'];
    } else if (overId.startsWith('task-')) {
      const targetTask = tasks.find((task) => task.id === overId.replace('task-', ''));
      targetStatus = targetTask?.status ?? null;
    }

    if (!targetStatus || targetStatus === sourceTask.status) return;
    await onStatusChange(sourceTask.id, targetStatus);
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 lg:grid-cols-3">
          {STATUS_COLUMNS.map((column) => (
            <BoardColumn
              key={column.key}
              id={column.key}
              label={column.label}
              tasks={tasks.filter((task) => task.status === column.key)}
              assigneeMap={assigneeMap}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      </DndContext>

      <div>
        <Button variant="outline" onClick={onQuickAdd}>
          Add task to To Do
        </Button>
      </div>
    </div>
  );
}
