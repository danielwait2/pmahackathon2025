'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailabilityGrid } from './AvailabilityGrid';
import { TeamAvailability } from './TeamAvailability';
import { MeetingFinder } from './MeetingFinder';
import { UpcomingMeetings } from './UpcomingMeetings';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import {
  jsonToSlots,
  getWeekRangeLabel,
  getWeekStartKey,
  getWeekDateWithOffset,
  type TimeSlot,
  type UserAvailability,
} from './availability-utils';

interface AvailabilityTabProps {
  projectId: string;
  currentUserId: string | null;
  initialSlots: string; // JSON string from database
  teamAvailabilities: UserAvailability[];
  isUsingGeneralDefault?: boolean;
}

export function AvailabilityTab({
  projectId,
  currentUserId,
  initialSlots,
  teamAvailabilities,
  isUsingGeneralDefault = false,
}: AvailabilityTabProps) {
  const router = useRouter();
  const [mySlots, setMySlots] = useState<TimeSlot[]>(() => jsonToSlots(initialSlots));
  const [teamData, setTeamData] = useState<UserAvailability[]>(teamAvailabilities);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [meetingRefreshTrigger, setMeetingRefreshTrigger] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoadingWeek, setIsLoadingWeek] = useState(true); // Start true to fetch on mount
  const [isQuickScheduleOpen, setIsQuickScheduleOpen] = useState(false);
  const [quickScheduleSlot, setQuickScheduleSlot] = useState<TimeSlot | null>(null);
  const [hasCustomizedProjectAvailability, setHasCustomizedProjectAvailability] = useState(!isUsingGeneralDefault);

  const weekLabel = useMemo(() => getWeekRangeLabel(weekOffset), [weekOffset]);
  const weekStart = useMemo(() => getWeekStartKey(weekOffset), [weekOffset]);

  useEffect(() => {
    setTeamData(teamAvailabilities);
  }, [teamAvailabilities]);

  useEffect(() => {
    setHasCustomizedProjectAvailability(!isUsingGeneralDefault);
  }, [isUsingGeneralDefault]);

  // Always fetch from API - uses client's weekStart for correct week-key extraction (fixes timezone mismatch)
  useEffect(() => {
    const fetchWeekAvailability = async () => {
      setIsLoadingWeek(true);
      try {
        const response = await fetch(`/api/availability/${projectId}?weekStart=${weekStart}`);
        if (!response.ok) return;
        const data = await response.json();
        const formatted: UserAvailability[] = (Array.isArray(data) ? data : []).map((entry: { userId?: string; userName?: string; slots?: unknown }) => ({
          userId: String(entry.userId ?? ''),
          userName: entry.userName ?? 'Guest',
          slots: Array.isArray(entry.slots) ? entry.slots : [],
        }));

        setTeamData(formatted);
        const mine =
          formatted.find((item) => currentUserId && String(item.userId) === String(currentUserId))?.slots ?? [];
        setMySlots(mine);
        setHasChanges(false);
      } finally {
        setIsLoadingWeek(false);
      }
    };

    void fetchWeekAvailability();
  }, [weekOffset, weekStart, projectId, currentUserId]);

  const handleSlotsChange = (newSlots: TimeSlot[]) => {
    setMySlots(newSlots);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          slots: mySlots,
          weekStart,
        }),
      });
      if (res.ok) {
        setHasChanges(false);
        setHasCustomizedProjectAvailability(true);
        setMeetingRefreshTrigger((prev) => prev + 1);
        router.refresh(); // Refetch server data so team heatmap updates
      }
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMeetingScheduled = () => {
    setMeetingRefreshTrigger((prev) => prev + 1);
  };

  const handleHeatmapSlotClick = (slot: TimeSlot) => {
    setQuickScheduleSlot(slot);
    setIsQuickScheduleOpen(true);
  };

  const getSlotDateString = (dayIndex: number): string => {
    // dayIndex is 0=Sunday, 1=Monday, etc. from DAYS_OF_WEEK
    // Convert to week day index (0=Monday)
    const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const date = getWeekDateWithOffset(weekDayIndex, weekOffset);
    return date.toISOString().split('T')[0];
  };

  const getSlotTimeString = (hour: number): string => {
    const wholeHour = Math.floor(hour);
    const minutes = (hour % 1) * 60;
    return `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{weekLabel}</p>
          {weekOffset !== 0 && <p className="text-xs text-blue-700">Viewing {weekOffset > 0 ? 'future' : 'past'} week</p>}
          {isUsingGeneralDefault && !hasCustomizedProjectAvailability && (
            <p className="text-xs text-emerald-700">You are currently using your general availability for this project.</p>
          )}
          {hasCustomizedProjectAvailability && (
            <p className="text-xs text-slate-600">This project uses its own availability overrides.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset((prev) => prev + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Link href="/settings/availability">
            <Button variant="outline" size="sm">Edit My General Availability</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="my-availability" className="w-full">
        <TabsList>
          <TabsTrigger value="my-availability">My Availability</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="my-availability" className="space-y-4">
          {isLoadingWeek ? (
            <p className="text-sm text-slate-600">Loading availability for this week...</p>
          ) : (
            <AvailabilityGrid slots={mySlots} onChange={handleSlotsChange} weekOffset={weekOffset} />
          )}

          {hasChanges && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save My Availability'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="min-w-0">
              <TeamAvailability
                availabilities={teamData}
                weekOffset={weekOffset}
                compact
                onSlotClick={handleHeatmapSlotClick}
              />
            </div>
            <div className="space-y-4 min-w-0">
              <UpcomingMeetings
                projectId={projectId}
                currentUserId={currentUserId}
                refreshTrigger={meetingRefreshTrigger}
              />
              <MeetingFinder
                projectId={projectId}
                availabilities={teamData}
                minDuration={1}
                onMeetingScheduled={handleMeetingScheduled}
                weekOffset={weekOffset}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {quickScheduleSlot && (
        <ScheduleMeetingModal
          isOpen={isQuickScheduleOpen}
          onClose={() => setIsQuickScheduleOpen(false)}
          onSuccess={handleMeetingScheduled}
          projectId={projectId}
          prefilledDate={getSlotDateString(quickScheduleSlot.day)}
          prefilledStartTime={getSlotTimeString(quickScheduleSlot.startHour)}
          prefilledEndTime={getSlotTimeString(quickScheduleSlot.endHour)}
          prefilledDurationMinutes={Math.round((quickScheduleSlot.endHour - quickScheduleSlot.startHour) * 60)}
        />
      )}
    </div>
  );
}
