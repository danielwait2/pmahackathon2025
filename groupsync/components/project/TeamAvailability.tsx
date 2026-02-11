'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  DAYS_OF_WEEK,
  HALF_HOURS,
  createAvailabilityGrid,
  formatHour,
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
            <div className="inline-block min-w-full">
              {/* Header Row - Days */}
              <div className="grid grid-cols-8 gap-px bg-slate-200 rounded-t-lg overflow-hidden">
                <div className="bg-white p-2 text-xs font-medium text-slate-600">Time</div>
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="bg-white p-2 text-xs font-medium text-center text-slate-900">
                    {day.substring(0, 3)}
                  </div>
                ))}
              </div>

              {/* Time Slots Grid */}
              <div className="grid grid-cols-8 gap-px bg-slate-200">
                {DISPLAY_HALF_HOURS.map((halfHour) => {
                  const halfHourIndex = Math.floor(halfHour * 2);
                  return (
                    <React.Fragment key={halfHour}>
                      {/* Time Label (only show on the hour) */}
                      <div className="bg-white p-1 text-xs text-slate-600 flex items-center">
                        {halfHour % 1 === 0 ? formatHour(halfHour) : ''}
                      </div>

                      {/* Day Cells */}
                      {DAYS_OF_WEEK.map((_, day) => {
                        const count = overlapCounts[day]?.[halfHourIndex] || 0;

                        // Generate color based on how many people are available
                        const bgColor = count === 0
                          ? 'bg-white'
                          : count === maxCount
                          ? 'bg-green-600'
                          : count >= maxCount / 2
                          ? 'bg-green-400'
                          : 'bg-green-200';

                        return (
                          <div
                            key={`${day}-${halfHourIndex}`}
                            className={`h-4 flex items-center justify-center text-xs transition-colors ${bgColor}`}
                            title={`${count} of ${maxCount} available`}
                          >
                            {count > 0 && halfHour % 1 === 0 && (
                              <span className={count >= maxCount / 2 ? 'text-white font-medium' : 'text-slate-700'}>
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
