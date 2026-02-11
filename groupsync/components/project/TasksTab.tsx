'use client';

import { useState } from 'react';
import { TaskBoard } from './TaskBoard';
import { AddTaskModal, type TaskFormData, type ProjectMember } from './AddTaskModal';
import { TaskDetailModal, type TaskDetail } from './TaskDetailModal';

export interface ProjectTaskItem {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  assigneeName: string | null;
  assignedTo: string | null;
  createdAt: string;
}

interface TasksTabProps {
  projectId: string;
  tasks: ProjectTaskItem[];
  members: ProjectMember[];
  onRefresh: () => void;
}

export function TasksTab({ projectId, tasks, members, onRefresh }: TasksTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const handleAddTask = (status: 'todo' | 'in_progress' | 'done') => {
    setDefaultStatus(status);
    setIsAddModalOpen(true);
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCreateTask = async (data: TaskFormData) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        title: data.title,
        description: data.description || null,
        assignedTo: data.assignedTo || null,
        status: data.status,
        dueDate: data.dueDate || null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    onRefresh();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    onRefresh();
    setSelectedTaskId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }

    onRefresh();
    setSelectedTaskId(null);
  };

  return (
    <>
      <TaskBoard
        tasks={tasks}
        onTaskClick={handleTaskClick}
        onAddTask={handleAddTask}
        onTaskMove={handleUpdateTaskStatus}
      />

      <AddTaskModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId}
        members={members}
        onSubmit={handleCreateTask}
        initialData={{ status: defaultStatus }}
        mode="create"
      />

      {selectedTask && (
        <TaskDetailModal
          open={!!selectedTask}
          onClose={() => setSelectedTaskId(null)}
          task={{
            id: selectedTask.id,
            title: selectedTask.title,
            description: selectedTask.description,
            status: selectedTask.status,
            dueDate: selectedTask.dueDate,
            assigneeName: selectedTask.assigneeName,
            createdAt: selectedTask.createdAt,
          }}
          onStatusChange={handleUpdateTaskStatus}
          onDelete={handleDeleteTask}
        />
      )}
    </>
  );
}
