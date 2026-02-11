'use client';

import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvailabilitySlot } from '@/types';

import {
  collapseCellSetToSlots,
  DAYS,
  expandSlotsToCellSet,
  formatTimeLabel,
  getCellKey,
  TIME_SLOTS,
} from '@/components/project/availability-utils';

interface AvailabilityGridProps {
  initialSlots: AvailabilitySlot[];
  onSave: (slots: AvailabilitySlot[]) => Promise<void>;
  saving: boolean;
}

interface DayRange {
  id: string;
  day: number;
  start: string;
  end: string;
}

const END_TIME = '22:00';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function slotsToRanges(slots: AvailabilitySlot[]): DayRange[] {
  return slots.map((slot) => ({ id: uid(), ...slot }));
}

function rangesToSlots(ranges: DayRange[]): AvailabilitySlot[] {
  return ranges.map((range) => ({ day: range.day, start: range.start, end: range.end }));
}

export function AvailabilityGrid({ initialSlots, onSave, saving }: AvailabilityGridProps) {
  const [selected, setSelected] = useState<Set<string>>(() => expandSlotsToCellSet(initialSlots));
  const [dragMode, setDragMode] = useState<'add' | 'remove' | null>(null);
  const [mobileRanges, setMobileRanges] = useState<DayRange[]>(() => slotsToRanges(initialSlots));

  useEffect(() => {
    const handleMouseUp = () => setDragMode(null);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const slots = useMemo(() => collapseCellSetToSlots(selected), [selected]);

  const setCell = (day: number, index: number, mode: 'add' | 'remove') => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = getCellKey(day, index);
      if (mode === 'add') {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const onCellMouseDown = (day: number, index: number) => {
    const key = getCellKey(day, index);
    const mode: 'add' | 'remove' = selected.has(key) ? 'remove' : 'add';
    setDragMode(mode);
    setCell(day, index, mode);
  };

  const onCellMouseEnter = (day: number, index: number) => {
    if (!dragMode) return;
    setCell(day, index, dragMode);
  };

  const syncFromMobileRanges = (ranges: DayRange[]) => {
    setMobileRanges(ranges);
    setSelected(expandSlotsToCellSet(rangesToSlots(ranges)));
  };

  const addRange = (day: number) => {
    syncFromMobileRanges([...mobileRanges, { id: uid(), day, start: '09:00', end: '11:00' }]);
  };

  const updateRange = (id: string, patch: Partial<DayRange>) => {
    syncFromMobileRanges(mobileRanges.map((range) => (range.id === id ? { ...range, ...patch } : range)));
  };

  const removeRange = (id: string) => {
    syncFromMobileRanges(mobileRanges.filter((range) => range.id !== id));
  };

  const save = async () => {
    await onSave(slots);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden overflow-auto rounded-md border border-slate-200 md:block">
          <div className="grid min-w-[720px]" style={{ gridTemplateColumns: '84px repeat(7, minmax(80px, 1fr))' }}>
            <div className="border-b border-r bg-slate-50 p-2 text-xs font-semibold text-slate-500">Time</div>
            {DAYS.map((day) => (
              <div key={day.day} className="border-b border-r bg-slate-50 p-2 text-center text-xs font-semibold text-slate-600 last:border-r-0">
                {day.short}
              </div>
            ))}

            {TIME_SLOTS.map((time, index) => (
              <div key={time} className="contents">
                <div key={`label-${time}`} className="border-r border-b p-2 text-xs text-slate-500">
                  {formatTimeLabel(time)}
                </div>
                {DAYS.map((day) => {
                  const key = getCellKey(day.day, index);
                  const active = selected.has(key);
                  return (
                    <button
                      key={`${day.day}-${time}`}
                      type="button"
                      className={`h-6 border-r border-b transition-colors last:border-r-0 ${
                        active ? 'bg-emerald-400 hover:bg-emerald-500' : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                      onMouseDown={() => onCellMouseDown(day.day, index)}
                      onMouseEnter={() => onCellMouseEnter(day.day, index)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:hidden">
          {DAYS.map((day) => {
            const ranges = mobileRanges.filter((range) => range.day === day.day);
            return (
              <div key={day.day} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{day.label}</p>
                  <Button size="sm" variant="outline" onClick={() => addRange(day.day)}>
                    Add time range
                  </Button>
                </div>
                <div className="space-y-2">
                  {ranges.length === 0 && <p className="text-xs text-slate-500">No ranges yet.</p>}
                  {ranges.map((range) => (
                    <div key={range.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Start</Label>
                        <Select value={range.start} onValueChange={(value) => updateRange(range.id, { start: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_SLOTS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTimeLabel(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End</Label>
                        <Select value={range.end} onValueChange={(value) => updateRange(range.id, { end: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...TIME_SLOTS, END_TIME].map((time) => (
                              <SelectItem key={time} value={time}>
                                {formatTimeLabel(time)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeRange(range.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Availability'}
        </Button>
      </CardContent>
    </Card>
  );
}
