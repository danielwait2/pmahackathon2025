'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Availability, ProjectMember } from '@/types';

import {
  DAYS,
  formatTimeLabel,
  isMemberAvailableAt,
  TIME_SLOTS,
} from '@/components/project/availability-utils';

interface TeamAvailabilityProps {
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  availability: Availability[];
}

function colorClass(count: number, total: number) {
  if (count === 0) return 'bg-slate-50';
  const ratio = count / total;
  if (ratio === 1) return 'bg-emerald-600';
  if (ratio >= 0.5) return 'bg-emerald-400';
  return 'bg-emerald-200';
}

export function TeamAvailability({ members, availability }: TeamAvailabilityProps) {
  const memberMap = useMemo(
    () =>
      members.map((member) => ({
        id: member.user_id,
        name: member.profile.name,
        slots: availability.find((record) => record.user_id === member.user_id)?.slots ?? [],
      })),
    [availability, members]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-auto rounded-md border border-slate-200">
          <div className="grid min-w-[720px]" style={{ gridTemplateColumns: '84px repeat(7, minmax(80px, 1fr))' }}>
            <div className="border-b border-r bg-slate-50 p-2 text-xs font-semibold text-slate-500">Time</div>
            {DAYS.map((day) => (
              <div key={day.day} className="border-b border-r bg-slate-50 p-2 text-center text-xs font-semibold text-slate-600 last:border-r-0">
                {day.short}
              </div>
            ))}

            {TIME_SLOTS.map((time, index) => (
              <div key={time} className="contents">
                <div key={`time-${time}`} className="border-r border-b p-2 text-xs text-slate-500">
                  {formatTimeLabel(time)}
                </div>
                {DAYS.map((day) => {
                  const available = memberMap.filter((member) => isMemberAvailableAt(member.slots, day.day, index));
                  const unavailable = memberMap.filter((member) => !isMemberAvailableAt(member.slots, day.day, index));
                  const title = `Available: ${available.map((entry) => entry.name).join(', ') || 'None'}\nUnavailable: ${
                    unavailable.map((entry) => entry.name).join(', ') || 'None'
                  }`;

                  return (
                    <div
                      key={`${day.day}-${time}`}
                      title={title}
                      className={`h-6 border-r border-b last:border-r-0 ${colorClass(available.length, memberMap.length || 1)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Legend:</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-50" />No one</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-200" />Some</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-400" />Most</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-600" />Everyone</span>
        </div>
      </CardContent>
    </Card>
  );
}
