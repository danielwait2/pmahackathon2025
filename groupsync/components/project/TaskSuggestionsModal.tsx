'use client';

import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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
import { createClient } from '@/lib/supabase';
import { AISuggestedTask, Task } from '@/types';

interface TaskSuggestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: AISuggestedTask[];
  projectId: string;
  onTasksAdded: (tasks: Task[]) => void;
  nextOrderIndex: number;
}

function priorityBadge(priority: AISuggestedTask['priority']) {
  if (priority === 'high') return 'destructive' as const;
  if (priority === 'medium') return 'secondary' as const;
  return 'outline' as const;
}

export function TaskSuggestionsModal({
  open,
  onOpenChange,
  suggestions,
  projectId,
  onTasksAdded,
  nextOrderIndex,
}: TaskSuggestionsModalProps) {
  const [addingIds, setAddingIds] = useState<string[]>([]);

  const items = useMemo(
    () => suggestions.map((suggestion, index) => ({ key: `${suggestion.title}-${index}`, suggestion, index })),
    [suggestions]
  );

  const addSelected = async (indices: number[]) => {
    if (!indices.length) return;
    setAddingIds(indices.map((idx) => String(idx)));
    try {
      const supabase = createClient();
      const rows = indices.map((idx, offset) => {
        const suggestion = suggestions[idx];
        return {
          project_id: projectId,
          title: suggestion.title,
          description: `${suggestion.description}\nEst: ${suggestion.estimatedHours}h`,
          status: 'todo',
          order_index: nextOrderIndex + offset,
        };
      });

      const { data, error } = await supabase.from('tasks').insert(rows).select();
      if (error || !data) {
        toast.error(error?.message ?? 'Failed to add suggestions');
        return;
      }

      onTasksAdded(data as Task[]);
      toast.success(indices.length === 1 ? 'Task added' : `${indices.length} tasks added`);
    } catch {
      toast.error('Failed to add suggestions');
    } finally {
      setAddingIds([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Suggested Tasks</DialogTitle>
          <DialogDescription>Review each suggestion and add what you need.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {items.map(({ key, suggestion, index }) => {
            const added = addingIds.includes(String(index));
            return (
              <div key={key} className={`rounded-md border p-3 ${added ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{suggestion.title}</p>
                    <p className="text-sm text-slate-600">{suggestion.description}</p>
                  </div>
                  <Badge variant={priorityBadge(suggestion.priority)}>{suggestion.priority}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline">~{suggestion.estimatedHours}h</Badge>
                  <Button size="sm" variant="outline" disabled={added} onClick={() => addSelected([index])}>
                    {added ? (
                      <>
                        <Check className="h-4 w-4" /> Added
                      </>
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => addSelected(items.map((item) => item.index))}>Add All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
