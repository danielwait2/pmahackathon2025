'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import {
  findCommonAvailability,
  suggestMeetingTimes,
  formatTimeSlot,
  formatHour,
  DAYS_OF_WEEK,
  getWeekDateWithOffset,
  type UserAvailability,
  type TimeSlot,
} from './availability-utils';

interface MeetingFinderProps {
  projectId: string;
  availabilities: UserAvailability[];
  minDuration?: number; // In hours (supports halves, e.g. 0.5, 1.5)
  onMeetingScheduled?: () => void;
  weekOffset?: number;
}

export function MeetingFinder({
  projectId,
  availabilities,
  minDuration = 1,
  onMeetingScheduled,
  weekOffset = 0,
}: MeetingFinderProps) {
  const [selectedDuration, setSelectedDuration] = useState(minDuration);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Initialize with all members selected
  useEffect(() => {
    if (selectedMemberIds.length === 0 && availabilities.length > 0) {
      setSelectedMemberIds(availabilities.map((a) => a.userId));
    }
  }, [availabilities, selectedMemberIds.length]);

  // Helper function for initials
  const initials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  };

  // Toggle member selection
  const toggleMemberSelection = (userId: string) => {
    setSelectedMemberIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };

  // Select/deselect all handlers
  const selectAllMembers = () => {
    setSelectedMemberIds(availabilities.map((a) => a.userId));
  };

  const clearAllMembers = () => {
    if (availabilities.length > 0) {
      setSelectedMemberIds([availabilities[0].userId]);
    }
  };

  // Find all common availability slots
  const commonSlots = useMemo(() => {
    const selectedAvailabilities = availabilities.filter((a) =>
      selectedMemberIds.includes(a.userId)
    );

    if (selectedAvailabilities.length === 0) return [];

    return findCommonAvailability(selectedAvailabilities);
  }, [availabilities, selectedMemberIds]);

  // Filter by minimum duration
  const suggestedTimes = useMemo(() => {
    return suggestMeetingTimes(commonSlots, selectedDuration);
  }, [commonSlots, selectedDuration]);

  // Group suggested times by day for better display
  const timesByDay = useMemo(() => {
    const grouped = new Map<number, TimeSlot[]>();
    for (const slot of suggestedTimes) {
      if (!grouped.has(slot.day)) {
        grouped.set(slot.day, []);
      }
      grouped.get(slot.day)!.push(slot);
    }
    return grouped;
  }, [suggestedTimes]);

  const totalParticipants = availabilities.length;

  const handleScheduleClick = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleMeetingSuccess = () => {
    if (onMeetingScheduled) {
      onMeetingScheduled();
    }
  };

  const getSlotDateString = (dayIndex: number): string => {
    // dayIndex is 0=Sunday, 1=Monday, etc. from DAYS_OF_WEEK
    // Convert to week day index (0=Monday)
    const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const date = getWeekDateWithOffset(weekDayIndex, weekOffset);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getSlotTimeString = (hour: number): string => {
    const wholeHour = Math.floor(hour);
    const minutes = (hour % 1) * 60;
    return `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const durationLabel = (durationHours: number) => {
    const minutes = Math.round(durationHours * 60);
    if (minutes < 60) return `${minutes} min`;
    if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
    return `${minutes / 60} hours`;
  };

  if (totalParticipants === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-slate-600">
          No availability data yet. Team members need to set their availability first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Meeting Time Finder</CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMemberIds.length === totalParticipants
                  ? `Finding times when all ${totalParticipants} team member${totalParticipants !== 1 ? 's' : ''} are available`
                  : `Finding times for ${selectedMemberIds.length} of ${totalParticipants} selected members`}
              </p>
            </div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Users className="h-4 w-4" />
                  {selectedMemberIds.length === totalParticipants
                    ? `All ${totalParticipants}`
                    : `${selectedMemberIds.length}/${totalParticipants}`}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <PopoverHeader>
                  <PopoverTitle>Select Participants</PopoverTitle>
                </PopoverHeader>
                <Separator className="my-3" />

                {/* Quick Actions */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllMembers}
                    disabled={selectedMemberIds.length === totalParticipants}
                    className="flex-1 h-8 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllMembers}
                    disabled={selectedMemberIds.length === 1}
                    className="flex-1 h-8 text-xs"
                  >
                    Clear All
                  </Button>
                </div>

                <Separator className="my-3" />

                {/* Member List */}
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {availabilities.map((availability) => {
                    const isSelected = selectedMemberIds.includes(availability.userId);
                    return (
                      <button
                        key={availability.userId}
                        onClick={() => toggleMemberSelection(availability.userId)}
                        className={cn(
                          'w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left',
                          isSelected
                            ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                            : 'hover:bg-slate-100 border border-transparent'
                        )}
                      >
                        <Avatar>
                          <AvatarFallback className="text-xs">
                            {initials(availability.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm font-medium text-slate-900">
                          {availability.userName}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>

                {selectedMemberIds.length < totalParticipants && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-slate-500 text-center">
                      At least 1 member must be selected
                    </p>
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Minimum duration:</label>
            <div className="flex gap-2">
              {[0.5, 1, 1.5, 2].map((hours) => (
                <Button
                  key={hours}
                  variant={selectedDuration === hours ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDuration(hours)}
                >
                  {hours === 0.5 ? '30m' : `${hours}h`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Meeting Times */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Suggested Times ({suggestedTimes.length} slots available)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestedTimes.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600">
                No common availability found for {durationLabel(selectedDuration)} meetings.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Try a shorter duration or have team members update their availability.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(timesByDay.entries())
                .sort(([dayA], [dayB]) => dayA - dayB)
                .map(([day, slots]) => (
                  <div key={day}>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {DAYS_OF_WEEK[day]}
                    </h3>
                    <div className="space-y-2">
                      {slots.map((slot, index) => {
                        const duration = slot.endHour - slot.startHour;
                        return (
                          <div
                            key={index}
                            className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-slate-900">
                                  {formatHour(slot.startHour)} - {formatHour(slot.endHour)}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                                  <Clock className="h-3 w-3" />
                                  {durationLabel(duration)}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                <Badge variant="outline" className="text-xs">
                                  {selectedMemberIds.length === totalParticipants
                                    ? 'All available'
                                    : `${selectedMemberIds.length} available`}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleScheduleClick(slot)}
                                  className="h-7 text-xs"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Schedule
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {suggestedTimes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Total available meeting slots:</span>
              <span className="font-semibold text-slate-900">{suggestedTimes.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-600">Total hours available:</span>
              <span className="font-semibold text-slate-900">
                {suggestedTimes.reduce((sum, slot) => sum + (slot.endHour - slot.startHour), 0)} hours
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Meeting Modal */}
      {selectedSlot && (
        <ScheduleMeetingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleMeetingSuccess}
          projectId={projectId}
          prefilledDate={getSlotDateString(selectedSlot.day)}
          prefilledStartTime={getSlotTimeString(selectedSlot.startHour)}
          prefilledEndTime={getSlotTimeString(selectedSlot.endHour)}
          prefilledDurationMinutes={Math.round((selectedSlot.endHour - selectedSlot.startHour) * 60)}
        />
      )}
    </div>
  );
}
