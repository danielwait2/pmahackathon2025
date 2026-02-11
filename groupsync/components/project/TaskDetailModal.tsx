'use client';

import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase';
import { ProjectMember, Task } from '@/types';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  members,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setAssignedTo(task.assigned_to ?? 'unassigned');
    setDueDate(task.due_date ?? '');
    setStatus(task.status);
  }, [task]);

  if (!task) return null;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
          due_date: dueDate || null,
          status,
        })
        .eq('id', task.id)
        .select()
        .single();

      if (error || !data) {
        toast.error(error?.message ?? 'Unable to update task.');
        return;
      }

      onTaskUpdated(data as Task);
      toast.success('Task updated');
      onOpenChange(false);
    } catch {
      toast.error('Unable to update task.');
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) {
        toast.error(error.message);
        return;
      }

      onTaskDeleted(task.id);
      toast.success('Task deleted');
      onOpenChange(false);
    } catch {
      toast.error('Unable to delete task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
          <DialogDescription>Edit the selected task.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={save}>
          <div className="space-y-2">
            <Label htmlFor="detail-title">Title</Label>
            <Input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="detail-description">Description</Label>
            <Textarea id="detail-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail-due-date">Due Date</Label>
              <Input id="detail-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value: Task['status']) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button type="button" variant="destructive" onClick={remove} disabled={loading}>
              Delete
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
