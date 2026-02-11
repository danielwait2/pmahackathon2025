'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  DAYS_OF_WEEK,
  HALF_HOURS,
  createAvailabilityGrid,
  formatHour,
  getDayHeaderWithDate,
  type UserAvailability,
} from './availability-utils';

interface TeamAvailabilityProps {
  availabilities: UserAvailability[];
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

export function TeamAvailability({ availabilities }: TeamAvailabilityProps) {
  // Create grids for each user
  const userGrids = availabilities.map((avail, index) => ({
    ...avail,
    grid: createAvailabilityGrid(avail.slots),
    color: USER_COLORS[index % USER_COLORS.length],
  }));

  console.log('TeamAvailability - Total users:', availabilities.length);
  console.log('TeamAvailability - User grids:', userGrids.map(u => ({
    name: u.userName,
    slotCount: u.slots.length,
    hasData: u.grid.some(day => day.some(slot => slot))
  })));

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

  console.log('TeamAvailability - Max overlap found:', Math.max(...overlapCounts.flat()));

  const maxCount = availabilities.length;

  return (
    <div className="space-y-4">
      {/* Legend - Show all team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
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
          <CardTitle className="text-base">Team Availability Heatmap</CardTitle>
          <p className="text-sm text-slate-600">
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
                    {getDayHeaderWithDate(idx)}
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

                        // Generate color based on how many people are available
                        const bgColor = count === 0
                          ? 'bg-white hover:bg-slate-50'
                          : count === maxCount
                          ? 'bg-green-600 hover:bg-green-700'
                          : count >= maxCount / 2
                          ? 'bg-green-400 hover:bg-green-500'
                          : 'bg-green-200 hover:bg-green-300';

                        return (
                          <div
                            key={`${day}-${halfHourIndex}`}
                            className={`h-4 flex items-center justify-center text-[10px] transition-colors ${bgColor} ${isFullHour ? 'border-t-2 border-t-slate-300' : ''}`}
                            title={`${count} of ${maxCount} available`}
                          >
                            {count > 0 && (
                              <span className={count >= maxCount / 2 ? 'text-white font-bold' : 'text-slate-700 font-semibold'}>
                                {count}
                              </span>
                            )}
                          </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
