'use client';

import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  prefilledDate?: string;
  prefilledStartTime?: string;
  prefilledEndTime?: string;
  prefilledDurationMinutes?: number;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  prefilledDate = '',
  prefilledStartTime = '',
  prefilledEndTime = '',
  prefilledDurationMinutes = 60,
}: ScheduleMeetingModalProps) {
  const initialDuration =
    prefilledDurationMinutes > 0
      ? prefilledDurationMinutes
      : getDurationMinutes(prefilledStartTime, prefilledEndTime) || 60;

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(prefilledDate);
  const [startTime, setStartTime] = useState(prefilledStartTime);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration);
  const [endTime, setEndTime] = useState(calculateEndTime(prefilledStartTime, initialDuration));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextDuration =
      prefilledDurationMinutes > 0
        ? prefilledDurationMinutes
        : getDurationMinutes(prefilledStartTime, prefilledEndTime) || 60;
    setDate(prefilledDate);
    setStartTime(prefilledStartTime);
    setDurationMinutes(nextDuration);
    setEndTime(calculateEndTime(prefilledStartTime, nextDuration));
  }, [prefilledDate, prefilledStartTime, prefilledEndTime, prefilledDurationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          date,
          startTime,
          endTime,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to schedule meeting');
      }

      // Reset form
      setTitle('');
      setDate(prefilledDate);
      setStartTime(prefilledStartTime);
      setDurationMinutes(initialDuration);
      setEndTime(calculateEndTime(prefilledStartTime, initialDuration));
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      setTitle('');
      onClose();
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    setEndTime(calculateEndTime(value, durationMinutes));
  };

  const handleDurationChange = (value: string) => {
    const nextDuration = Number(value);
    setDurationMinutes(nextDuration);
    setEndTime(calculateEndTime(startTime, nextDuration));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            Create a new meeting for your team. All members will be able to see it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input
                id="title"
                placeholder="Team Sync, Sprint Planning, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select value={String(durationMinutes)} onValueChange={handleDurationChange} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                readOnly
                disabled
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function parseTimeToMinutes(time: string): number | null {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = parseTimeToMinutes(startTime);
  if (startMinutes === null) return '';
  return formatMinutesToTime(startMinutes + durationMinutes);
}

function getDurationMinutes(startTime: string, endTime: string): number | null {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return null;
  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff : null;
}
