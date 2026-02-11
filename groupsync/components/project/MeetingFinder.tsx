'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Availability, MeetingSuggestion, ProjectMember } from '@/types';

import { DAYS, isMemberAvailableAt, START_HOUR, TIME_SLOTS } from '@/components/project/availability-utils';

interface MeetingFinderProps {
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  availability: Availability[];
  isOwner: boolean;
}

interface Candidate {
  day: number;
  startIndex: number;
  endIndex: number;
  availableMemberIds: string[];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toSuggestion(candidate: Candidate, members: MeetingFinderProps['members']): MeetingSuggestion {
  const startHour = START_HOUR + Math.floor(candidate.startIndex / 2);
  const startMinute = candidate.startIndex % 2 === 0 ? 0 : 30;
  const endHour = START_HOUR + Math.floor(candidate.endIndex / 2);
  const endMinute = candidate.endIndex % 2 === 0 ? 0 : 30;

  const startDate = new Date();
  startDate.setHours(startHour, startMinute, 0, 0);
  const endDate = new Date();
  endDate.setHours(endHour, endMinute, 0, 0);

  return {
    day: candidate.day,
    dayName: DAYS.find((day) => day.day === candidate.day)?.label ?? 'Unknown',
    start: format(startDate, 'h:mm a'),
    end: format(endDate, 'h:mm a'),
    duration: (candidate.endIndex - candidate.startIndex) * 30,
    availableMembers: members.filter((member) => candidate.availableMemberIds.includes(member.user_id)).map((member) => member.profile.name),
    totalMembers: members.length,
  };
}

export function MeetingFinder({ members, availability, isOwner }: MeetingFinderProps) {
  const [generated, setGenerated] = useState<MeetingSuggestion[]>([]);
  const [relaxed, setRelaxed] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const memberSlots = useMemo(
    () =>
      members.map((member) => ({
        id: member.user_id,
        slots: availability.find((record) => record.user_id === member.user_id)?.slots ?? [],
      })),
    [availability, members]
  );

  const findSuggestions = () => {
    setHasRun(true);
    const candidates: Candidate[] = [];

    const targetCounts = [members.length, Math.max(members.length - 1, 1)];

    for (const targetCount of targetCounts) {
      for (const day of DAYS) {
        let blockStart: number | null = null;
        let blockMembers: string[] = [];

        for (let idx = 0; idx <= TIME_SLOTS.length; idx += 1) {
          const available = idx < TIME_SLOTS.length
            ? memberSlots.filter((member) => isMemberAvailableAt(member.slots, day.day, idx)).map((member) => member.id)
            : [];
          const qualifies = available.length >= targetCount;

          if (qualifies && blockStart === null) {
            blockStart = idx;
            blockMembers = available;
            continue;
          }

          if (qualifies) {
            blockMembers = available;
            continue;
          }

          if (blockStart !== null) {
            candidates.push({
              day: day.day,
              startIndex: blockStart,
              endIndex: idx,
              availableMemberIds: blockMembers,
            });
            blockStart = null;
            blockMembers = [];
          }
        }
      }

      if (candidates.length > 0) {
        setRelaxed(targetCount !== members.length);
        break;
      }
    }

    const ranked = candidates
      .filter((candidate) => candidate.endIndex - candidate.startIndex >= 2)
      .sort((a, b) => {
        const memberScore = b.availableMemberIds.length - a.availableMemberIds.length;
        if (memberScore !== 0) return memberScore;

        const durationScore = Math.min(b.endIndex - b.startIndex, 4) - Math.min(a.endIndex - a.startIndex, 4);
        if (durationScore !== 0) return durationScore;

        const afternoonBoostA = a.startIndex >= 10 && a.startIndex <= 18 ? 1 : 0;
        const afternoonBoostB = b.startIndex >= 10 && b.startIndex <= 18 ? 1 : 0;
        return afternoonBoostB - afternoonBoostA;
      })
      .slice(0, 5)
      .map((candidate) => toSuggestion(candidate, members));

    setGenerated(ranked);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Meeting Finder</CardTitle>
        <Button onClick={findSuggestions}>Find Best Meeting Times</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasRun && generated.length === 0 && (
          <p className="text-sm text-slate-500">Run the finder to get top 5 meeting suggestions.</p>
        )}
        {hasRun && generated.length === 0 && (
          <p className="text-sm text-amber-700">No overlap found yet. Add more availability and try again.</p>
        )}
        {relaxed && generated.length > 0 && (
          <p className="text-sm text-amber-700">No times where everyone is free. Showing best options with all but one member.</p>
        )}

        {generated.map((suggestion, index) => {
          const missing = members
            .map((member) => member.profile.name)
            .filter((name) => !suggestion.availableMembers.includes(name));

          return (
            <div key={`${suggestion.day}-${index}`} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{suggestion.dayName} {suggestion.start} - {suggestion.end}</p>
                  <p className="text-sm text-slate-500">{Math.round(suggestion.duration / 60 * 10) / 10} hours</p>
                </div>
                {isOwner && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success('Meeting selection captured for demo.')}
                  >
                    Schedule This
                  </Button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                {suggestion.availableMembers.map((memberName) => (
                  <Avatar key={memberName} size="sm">
                    <AvatarFallback>{initials(memberName)}</AvatarFallback>
                  </Avatar>
                ))}
                <Badge variant="outline">
                  {suggestion.availableMembers.length}/{suggestion.totalMembers} available
                </Badge>
              </div>
              {missing.length > 0 && <p className="mt-2 text-xs text-slate-500">Missing: {missing.join(', ')}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
