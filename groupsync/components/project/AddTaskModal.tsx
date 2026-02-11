'use client';

import { FormEvent, useState } from 'react';
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

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  onTaskAdded: (task: Task) => void;
  nextOrderIndex: number;
}

export function AddTaskModal({ open, onOpenChange, projectId, members, onTaskAdded, nextOrderIndex }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('unassigned');
    setDueDate('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: assignedTo === 'unassigned' ? null : assignedTo,
          due_date: dueDate || null,
          status: 'todo',
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error || !data) {
        toast.error(error?.message ?? 'Unable to add task.');
        return;
      }

      onTaskAdded(data as Task);
      toast.success('Task added!');
      reset();
      onOpenChange(false);
    } catch {
      toast.error('Unable to add task right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>Create a new task for this project.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea id="task-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Assign to</Label>
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
              <Label htmlFor="task-due-date">Due date</Label>
              <Input id="task-due-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Adding...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
