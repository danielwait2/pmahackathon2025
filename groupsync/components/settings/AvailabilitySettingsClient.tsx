'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AvailabilityGrid } from '@/components/project/AvailabilityGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DAYS_OF_WEEK, jsonToSlots } from '@/components/project/availability-utils';

interface BlockItem {
  id: string;
  day: number;
  startHour: number;
  endHour: number;
}

interface AvailabilitySettingsClientProps {
  initialSlotsJson: string;
  initialBlocks: BlockItem[];
  isGoogleConnected: boolean;
}

function formatHour(hour: number) {
  const h = Math.floor(hour);
  const m = hour % 1 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}

function parseTimeToHour(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h + (m >= 30 ? 0.5 : 0);
}

export function AvailabilitySettingsClient({
  initialSlotsJson,
  initialBlocks,
  isGoogleConnected: initiallyConnected,
}: AvailabilitySettingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slots, setSlots] = useState(() => jsonToSlots(initialSlotsJson));
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [connected, setConnected] = useState(initiallyConnected);
  const [blockDay, setBlockDay] = useState(1);
  const [blockStart, setBlockStart] = useState('07:00');
  const [blockEnd, setBlockEnd] = useState('09:00');
  const [savingBlock, setSavingBlock] = useState(false);

  const googleStatus = searchParams.get('google');
  useEffect(() => {
    if (!googleStatus) return;
    if (googleStatus === 'connected') {
      setConnected(true);
      toast.success('Google Calendar connected.');
    } else {
      toast.error('Google Calendar connection was not completed.');
    }
  }, [googleStatus]);

  const saveDefaultAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/availability-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to save availability.');
        return;
      }
      toast.success('General availability saved.');
      router.refresh();
    } catch {
      toast.error('Unable to save availability.');
    } finally {
      setSaving(false);
    }
  };

  const importGoogleAvailability = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/user/availability-import/google', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to import Google availability.');
        return;
      }
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
      toast.success('Availability imported from Google.');
      router.refresh();
    } catch {
      toast.error('Unable to import Google availability.');
    } finally {
      setImporting(false);
    }
  };

  const addBlock = async () => {
    const startHour = parseTimeToHour(blockStart);
    const endHour = parseTimeToHour(blockEnd);
    if (startHour === null || endHour === null || startHour >= endHour) {
      toast.error('Invalid block time range.');
      return;
    }
    setSavingBlock(true);
    try {
      const res = await fetch('/api/user/availability-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: blockDay,
          startHour,
          endHour,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to add block.');
        return;
      }
      const created = await res.json();
      setBlocks((current) => [...current, created]);
      toast.success('Blocked time added.');
    } catch {
      toast.error('Unable to add block.');
    } finally {
      setSavingBlock(false);
    }
  };

  const removeBlock = async (id: string) => {
    setSavingBlock(true);
    try {
      const res = await fetch(`/api/user/availability-blocks?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to remove block.');
        return;
      }
      setBlocks((current) => current.filter((b) => b.id !== id));
      toast.success('Blocked time removed.');
    } catch {
      toast.error('Unable to remove block.');
    } finally {
      setSavingBlock(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Availability Settings</h1>
          <p className="text-sm text-slate-600">Set your default weekly availability for all projects.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvailabilityGrid slots={slots} onChange={setSlots} />
          <div className="flex justify-end">
            <Button onClick={saveDefaultAvailability} disabled={saving}>
              {saving ? 'Saving...' : 'Save general availability'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!connected ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Connect your Google Calendar to import busy times.</p>
              <Button asChild>
                <a href="/api/oauth/google">Connect Google Calendar</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">Google Calendar is connected.</p>
              <Button variant="outline" onClick={importGoogleAvailability} disabled={importing}>
                {importing ? 'Importing...' : 'Re-import from Google Calendar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Block Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label>Day</Label>
              <select
                className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                value={blockDay}
                onChange={(e) => setBlockDay(Number(e.target.value))}
              >
                {DAYS_OF_WEEK.map((day, idx) => (
                  <option key={day} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End</Label>
              <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={addBlock} disabled={savingBlock}>
                Add block
              </Button>
            </div>
          </div>

          {blocks.length === 0 ? (
            <p className="text-sm text-slate-500">No personal block rules yet.</p>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2">
                  <p className="text-sm text-slate-700">
                    {DAYS_OF_WEEK[block.day]} {formatHour(block.startHour)}-{formatHour(block.endHour)}
                  </p>
                  <Button variant="ghost" size="sm" disabled={savingBlock} onClick={() => removeBlock(block.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
