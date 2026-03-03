'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatClassNameForDisplay } from '@/lib/class-utils';

interface UserClassItem {
  id: string;
  classId: string;
  name: string;
}

interface MyClassesPanelProps {
  initialClasses: UserClassItem[];
}

export function MyClassesPanel({ initialClasses }: MyClassesPanelProps) {
  const router = useRouter();
  const [classes, setClasses] = useState(initialClasses);
  const [name, setName] = useState('');
  const [calendarClassName, setCalendarClassName] = useState('');
  const [calendarUrl, setCalendarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const addClass = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to add class.');
        return;
      }
      const saved = await res.json();
      setClasses((current) => {
        const deduped = current.filter((item) => item.classId !== saved.classId);
        return [...deduped, saved].sort((a, b) => a.name.localeCompare(b.name));
      });
      setName('');
      router.refresh();
    } catch {
      toast.error('Unable to add class.');
    } finally {
      setLoading(false);
    }
  };

  const removeClass = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/classes/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to remove class.');
        return;
      }
      setClasses((current) => current.filter((item) => item.id !== id));
      router.refresh();
    } catch {
      toast.error('Unable to remove class.');
    } finally {
      setLoading(false);
    }
  };

  const importFromCalendar = async (event: FormEvent) => {
    event.preventDefault();
    if (!calendarClassName.trim() || !calendarUrl.trim() || importing) return;
    setImporting(true);
    try {
      const res = await fetch('/api/classes/import-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: calendarClassName,
          calendarUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to import calendar.');
        return;
      }
      const data = await res.json();
      toast.success(`Imported ${data.createdAssignments} assignments and ${data.createdProjects} projects.`);
      setCalendarClassName('');
      setCalendarUrl('');
      router.refresh();
    } catch {
      toast.error('Unable to import calendar.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900">My Classes</h2>
      <p className="mt-1 text-xs text-slate-600">These appear first when selecting a class for projects and assignments.</p>

      <form className="mt-3 flex gap-2" onSubmit={addClass}>
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add a class"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !name.trim()}>
          Add
        </Button>
      </form>

      <div className="mt-3 space-y-2">
        {classes.length === 0 ? (
          <p className="text-sm text-slate-500">No classes added yet.</p>
        ) : (
          classes.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
              <span className="text-sm text-slate-900">{formatClassNameForDisplay(item.name)}</span>
              <Button variant="ghost" size="sm" disabled={loading} onClick={() => removeClass(item.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))
        )}
      </div>

      <form className="mt-4 space-y-2 rounded-lg border border-slate-200 p-3" onSubmit={importFromCalendar}>
        <p className="text-sm font-medium text-slate-900">Add from calendar</p>
        <Input
          value={calendarClassName}
          onChange={(event) => setCalendarClassName(event.target.value)}
          placeholder="Class name (e.g. STRAT 560-002)"
          disabled={importing}
        />
        <Input
          value={calendarUrl}
          onChange={(event) => setCalendarUrl(event.target.value)}
          placeholder="https://.../feed.ics"
          disabled={importing}
        />
        <Button type="submit" variant="outline" disabled={importing || !calendarClassName.trim() || !calendarUrl.trim()}>
          {importing ? 'Importing...' : 'Import calendar'}
        </Button>
      </form>
    </div>
  );
}
