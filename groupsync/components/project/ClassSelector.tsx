'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatClassNameForDisplay } from '@/lib/class-utils';

interface ClassOption {
  id: string;
  name: string;
  createdAt: string;
}

interface ClassSelectorProps {
  value: string | null;
  onChange: (classId: string | null) => void;
  disabled?: boolean;
}

const NONE_VALUE = '__none__';

export function ClassSelector({ value, onChange, disabled = false }: ClassSelectorProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        if (!res.ok) {
          throw new Error('Unable to fetch classes');
        }
        const data: ClassOption[] = await res.json();
        setClasses(data);
      } catch {
        toast.error('Unable to load classes.');
      } finally {
        setLoading(false);
      }
    };

    void loadClasses();
  }, []);

  const canCreate = useMemo(() => newClassName.trim().length > 0, [newClassName]);

  const handleAddClass = async () => {
    if (!canCreate || creating) {
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to add class.');
        return;
      }

      const savedClass: ClassOption = await res.json();
      setClasses((current) => {
        const next = current.some((item) => item.id === savedClass.id) ? current : [...current, savedClass];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      onChange(savedClass.id);
      setNewClassName('');
    } catch {
      toast.error('Unable to add class.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(nextValue) => onChange(nextValue === NONE_VALUE ? null : nextValue)}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? 'Loading classes...' : 'Select class (optional)'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None</SelectItem>
          {classes.map((classOption) => (
            <SelectItem key={classOption.id} value={classOption.id}>
              {formatClassNameForDisplay(classOption.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Input
          value={newClassName}
          onChange={(event) => setNewClassName(event.target.value)}
          placeholder="Add a new class"
          disabled={disabled || creating}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleAddClass();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAddClass} disabled={disabled || creating || !canCreate}>
          <Plus className="h-4 w-4" />
          {creating ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}
