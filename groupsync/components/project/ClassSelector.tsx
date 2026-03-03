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
  showMyClasses?: boolean;
}

const NONE_VALUE = '__none__';
const PERSONAL_VALUE = '__personal__';
const OTHER_VALUE = '__other__';

export function ClassSelector({ value, onChange, disabled = false, showMyClasses = false }: ClassSelectorProps) {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [myClasses, setMyClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const [allClassesRes, userClassesRes] = await Promise.all([
          fetch('/api/classes'),
          showMyClasses ? fetch('/api/user/classes') : Promise.resolve(null),
        ]);

        if (!allClassesRes.ok) {
          throw new Error('Unable to fetch classes');
        }
        const allClasses: ClassOption[] = await allClassesRes.json();
        setClasses(allClasses);

        if (showMyClasses && userClassesRes?.ok) {
          const userClassRows: Array<{ id: string; classId: string; name: string }> = await userClassesRes.json();
          setMyClasses(
            userClassRows.map((row) => ({
              id: row.classId,
              name: row.name,
              createdAt: '',
            }))
          );
        }
      } catch {
        toast.error('Unable to load classes.');
      } finally {
        setLoading(false);
      }
    };

    void loadClasses();
  }, [showMyClasses]);

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
      if (showMyClasses) {
        setMyClasses((current) => {
          const next = current.some((item) => item.id === savedClass.id) ? current : [...current, savedClass];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
      }
      onChange(savedClass.id);
      setNewClassName('');
    } catch {
      toast.error('Unable to add class.');
    } finally {
      setCreating(false);
    }
  };

  const myClassIds = new Set(myClasses.map((item) => item.id));
  const catalogWithoutMyClasses = classes.filter((item) => !myClassIds.has(item.id));

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
          <SelectItem value={PERSONAL_VALUE}>Personal</SelectItem>
          <SelectItem value={OTHER_VALUE}>Other</SelectItem>
          {showMyClasses && myClasses.length > 0 && (
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">My classes</div>
          )}
          {showMyClasses &&
            myClasses.map((classOption) => (
              <SelectItem key={`my-${classOption.id}`} value={classOption.id}>
                {formatClassNameForDisplay(classOption.name)}
              </SelectItem>
            ))}
          {catalogWithoutMyClasses.length > 0 && (
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">All classes</div>
          )}
          {catalogWithoutMyClasses.map((classOption) => (
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
