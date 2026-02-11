'use client';

import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Project, AISuggestedTask } from '@/types';

interface AISuggestButtonProps {
  project: Project;
  onSuggestions: (tasks: AISuggestedTask[]) => void;
}

export function AISuggestButton({ project, onSuggestions }: AISuggestButtonProps) {
  const [loading, setLoading] = useState(false);

  const request = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          description: project.description,
          deadline: project.deadline,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error ?? "AI suggestions aren't available right now");
        return;
      }

      onSuggestions(payload.tasks as AISuggestedTask[]);
    } catch {
      toast.error("AI suggestions aren't available right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={request} disabled={loading} title="AI suggestions require GEMINI_API_KEY">
      <Sparkles className="h-4 w-4" />
      {loading ? 'Generating suggestions...' : 'Suggest Tasks with AI'}
    </Button>
  );
}
