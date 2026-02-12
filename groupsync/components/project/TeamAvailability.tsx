'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import {
  DAYS_OF_WEEK,
  HALF_HOURS,
  createAvailabilityGrid,
  formatHour,
  getDayHeaderWithDate,
  getWeekDateWithOffset,
  type UserAvailability,
} from './availability-utils';

interface TeamAvailabilityProps {
  projectId: string;
  availabilities: UserAvailability[];
  weekOffset?: number;
  compact?: boolean;
  onMeetingScheduled?: () => void;
  meetingRefreshTrigger?: number;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}

// Show hours from 6 AM to 11 PM for better UX (in 30-minute increments)
const DISPLAY_HALF_HOURS = HALF_HOURS.filter(h => h >= 6 && h < 23);

// Color palette for different users
const USER_COLORS = [
  'bg-blue-500/70',
  'bg-green-500/70',
  'bg-purple-500/70',
  'bg-orange-500/70',
  'bg-pink-500/70',
  'bg-teal-500/70',
  'bg-indigo-500/70',
  'bg-red-500/70',
];

export function TeamAvailability({
  projectId,
  availabilities,
  weekOffset = 0,
  compact = false,
  onMeetingScheduled,
  meetingRefreshTrigger = 0,
}: TeamAvailabilityProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; startHour: number } | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Create grids for each user
  const userGrids = availabilities.map((avail, index) => ({
    ...avail,
    grid: createAvailabilityGrid(avail.slots),
    color: USER_COLORS[index % USER_COLORS.length],
  }));

  // Calculate how many people are available at each time slot (48 half-hour blocks)
  const overlapCounts: number[][] = Array.from({ length: 7 }, () => Array(48).fill(0));
  for (const { grid } of userGrids) {
    for (let day = 0; day < 7; day++) {
      for (let i = 0; i < 48; i++) {
        if (grid[day][i]) {
          overlapCounts[day][i]++;
        }
      }
    }
  }

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await fetch(`/api/meetings?projectId=${projectId}`);
        if (!response.ok) return;
        const data = await response.json();
        setMeetings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch meetings:', error);
      }
    };

    void fetchMeetings();
  }, [projectId, meetingRefreshTrigger]);

  const meetingsByDate = useMemo(() => {
    const byDate = new Map<string, Meeting[]>();
    for (const meeting of meetings) {
      const list = byDate.get(meeting.date) ?? [];
      list.push(meeting);
      byDate.set(meeting.date, list);
    }
    return byDate;
  }, [meetings]);

  const maxCount = availabilities.length;
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getSlotDateString = (dayIndex: number): string => {
    const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const date = getWeekDateWithOffset(weekDayIndex, weekOffset);
    return formatDateKey(date);
  };

  const getSlotTimeString = (hour: number): string => {
    const wholeHour = Math.floor(hour);
    const minutes = (hour % 1) * 60;
    return `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const handleCellClick = (day: number, startHour: number, count: number) => {
    if (count === 0) return;
    setSelectedSlot({ day, startHour });
    setIsModalOpen(true);
  };

  const parseTimeToHalfHourIndex = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 2 + Math.floor(minutes / 30);
  };

  const getMeetingForSlot = (day: number, halfHourIndex: number): Meeting | null => {
    const dateKey = getSlotDateString(day);
    const dateMeetings = meetingsByDate.get(dateKey);
    if (!dateMeetings || dateMeetings.length === 0) return null;

    for (const meeting of dateMeetings) {
      const startIndex = parseTimeToHalfHourIndex(meeting.startTime);
      const endIndex = parseTimeToHalfHourIndex(meeting.endTime);
      if (halfHourIndex >= startIndex && halfHourIndex < endIndex) {
        return meeting;
      }
    }
    return null;
  };

  const getMeetingChipLabel = (title: string): string => {
    const normalizedTitle = title.trim().replace(/\s+/g, ' ');
    if (!normalizedTitle) return 'M';
    return normalizedTitle.slice(0, 3);
  };

  return (
    <div className="space-y-4">
      {/* Legend - Show all team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{compact ? 'Members' : 'Team Members'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {userGrids.map(({ userId, userName, color }) => (
              <div key={userId} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded ${color}`} />
                <span className="text-sm text-slate-700">{userName}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Availability Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{compact ? 'Availability Heatmap' : 'Team Availability Heatmap'}</CardTitle>
          <p className={`${compact ? 'text-xs' : 'text-sm'} text-slate-600`}>
            Darker colors indicate more team members are available
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full border border-slate-200 rounded-lg overflow-hidden">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8">
                <div className="bg-slate-50 border-b border-r border-slate-200 p-2 text-xs font-medium text-slate-600">Time</div>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <div key={day} className={`bg-slate-50 border-b border-slate-200 p-2 text-xs font-medium text-center text-slate-900 ${idx < 6 ? 'border-r' : ''}`}>
                    {getDayHeaderWithDate(idx, weekOffset)}
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-8">
                {DISPLAY_HALF_HOURS.map((halfHour) => {
                  const halfHourIndex = Math.floor(halfHour * 2);
                  const isFullHour = halfHour % 1 === 0;

                  return (
                    <React.Fragment key={halfHour}>
                      {/* Time Label (only show on the hour) */}
                      <div className={`h-4 bg-white text-xs text-slate-600 flex items-center border-r border-slate-200 ${isFullHour ? 'p-1 font-bold border-t-2 border-t-slate-300' : ''}`}>
                        {isFullHour ? formatHour(halfHour) : ''}
                      </div>

                      {/* Day Cells */}
                      {DAYS_OF_WEEK.map((_, day) => {
                        const count = overlapCounts[day]?.[halfHourIndex] || 0;
                        const meeting = getMeetingForSlot(day, halfHourIndex);
                        const hasMeeting = Boolean(meeting);

                        // Generate color based on how many people are available
                        const bgColor = hasMeeting
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : count === 0
                          ? 'bg-white hover:bg-slate-50'
                          : count === maxCount
                          ? 'bg-green-600 hover:bg-green-700'
                          : count >= maxCount / 2
                          ? 'bg-green-400 hover:bg-green-500'
                          : 'bg-green-200 hover:bg-green-300';

                        return (
                          <button
                            type="button"
                            key={`${day}-${halfHourIndex}`}
                            onClick={() => handleCellClick(day, halfHour, count)}
                            disabled={count === 0 || hasMeeting}
                            className={`h-4 w-full flex items-center justify-center text-[10px] transition-colors ${bgColor} ${isFullHour ? 'border-t-2 border-t-slate-300' : ''} ${count > 0 ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-100`}
                            title={
                              hasMeeting
                                ? `${meeting?.title ?? 'Meeting'} at ${formatHour(halfHour)}`
                                : count > 0
                                ? `${count} of ${maxCount} available. Click to schedule at ${formatHour(halfHour)}.`
                                : `No one available at ${formatHour(halfHour)}`
                            }
                          >
                            {hasMeeting ? (
                              <span className="max-w-full truncate px-0.5 text-white font-bold">
                                {getMeetingChipLabel(meeting?.title ?? '')}
                              </span>
                            ) : count > 0 && (
                              <span className={count >= maxCount / 2 ? 'text-white font-bold' : 'text-slate-700 font-semibold'}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-200 rounded" />
              <span>Few available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-400 rounded" />
              <span>Some available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-600 rounded" />
              <span>Everyone available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-blue-600 rounded" />
              <span>Meeting scheduled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSlot && (
        <ScheduleMeetingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            onMeetingScheduled?.();
          }}
          projectId={projectId}
          prefilledDate={getSlotDateString(selectedSlot.day)}
          prefilledStartTime={getSlotTimeString(selectedSlot.startHour)}
          prefilledDurationMinutes={30}
        />
      )}
    </div>
  );
}
