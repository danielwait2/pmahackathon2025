'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase';
import { AISuggestedTask, Project, ProjectMember, Task } from '@/types';

import { AddTaskModal } from '@/components/project/AddTaskModal';
import { AISuggestButton } from '@/components/project/AISuggestButton';
import { TaskBoard } from '@/components/project/TaskBoard';
import { TaskDetailModal } from '@/components/project/TaskDetailModal';
import { TaskListView } from '@/components/project/TaskListView';
import { TaskSuggestionsModal } from '@/components/project/TaskSuggestionsModal';

interface TasksTabProps {
  project: Project;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  initialTasks: Task[];
  currentUserId: string;
  isOwner: boolean;
}

export function TasksTab({ project, members, initialTasks }: TasksTabProps) {
  const [tasks, setTasks] = useState<Task[]>(
    [...initialTasks].sort((a, b) => {
      if (a.status === b.status) return a.order_index - b.order_index;
      return a.created_at.localeCompare(b.created_at);
    })
  );
  const [view, setView] = useState<'board' | 'list'>('board');
  const [addOpen, setAddOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestedTask[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const assigneeMap = useMemo(
    () =>
      members.reduce<Record<string, string>>((acc, member) => {
        acc[member.user_id] = member.profile.name;
        return acc;
      }, {}),
    [members]
  );

  const nextOrderIndex = useMemo(
    () => (tasks.length ? Math.max(...tasks.map((task) => task.order_index)) + 1 : 0),
    [tasks]
  );

  const updateTaskInState = (updated: Task) => {
    setTasks((prev) => prev.map((task) => (task.id === updated.id ? { ...task, ...updated } : task)));
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    const previous = tasks;
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)));

    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
      if (error) {
        setTasks(previous);
        toast.error(error.message);
      }
    } catch {
      setTasks(previous);
      toast.error('Unable to update task status.');
    }
  };

  const toggleDone = async (task: Task) => {
    const nextStatus: Task['status'] = task.status === 'done' ? 'todo' : 'done';
    await handleStatusChange(task.id, nextStatus);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={view} onValueChange={(value) => setView(value as 'board' | 'list')}>
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <AISuggestButton
            project={project}
            onSuggestions={(items) => {
              setSuggestions(items);
              setSuggestionsOpen(true);
            }}
          />
          <Button onClick={() => setAddOpen(true)}>Add Task</Button>
        </div>
      </div>

      {view === 'board' ? (
        <TaskBoard
          tasks={tasks}
          assigneeMap={assigneeMap}
          onStatusChange={handleStatusChange}
          onOpenTask={setDetailTask}
          onQuickAdd={() => setAddOpen(true)}
        />
      ) : (
        <TaskListView tasks={tasks} assigneeMap={assigneeMap} onOpenTask={setDetailTask} onToggleDone={toggleDone} />
      )}

      <AddTaskModal
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={project.id}
        members={members}
        onTaskAdded={(task) => setTasks((prev) => [...prev, task])}
        nextOrderIndex={nextOrderIndex}
      />

      <TaskDetailModal
        task={detailTask}
        open={Boolean(detailTask)}
        onOpenChange={(open) => {
          if (!open) setDetailTask(null);
        }}
        members={members}
        onTaskUpdated={updateTaskInState}
        onTaskDeleted={(taskId) => setTasks((prev) => prev.filter((task) => task.id !== taskId))}
      />

      <TaskSuggestionsModal
        open={suggestionsOpen}
        onOpenChange={setSuggestionsOpen}
        suggestions={suggestions}
        projectId={project.id}
        onTasksAdded={(newTasks) => setTasks((prev) => [...prev, ...newTasks])}
        nextOrderIndex={nextOrderIndex}
      />
    </div>
  );
}
