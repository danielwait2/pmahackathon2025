'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  findCommonAvailability,
  suggestMeetingTimes,
  formatTimeSlot,
  formatHour,
  DAYS_OF_WEEK,
  type UserAvailability,
  type TimeSlot,
} from './availability-utils';

interface MeetingFinderProps {
  availabilities: UserAvailability[];
  minDuration?: number;
}

export function MeetingFinder({ availabilities, minDuration = 1 }: MeetingFinderProps) {
  const [selectedDuration, setSelectedDuration] = useState(minDuration);

  // Find all common availability slots
  const commonSlots = useMemo(() => {
    return findCommonAvailability(availabilities);
  }, [availabilities]);

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
                Finding times when all {totalParticipants} team member{totalParticipants !== 1 ? 's' : ''} are available
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalParticipants}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Minimum duration:</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((hours) => (
                <Button
                  key={hours}
                  variant={selectedDuration === hours ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDuration(hours)}
                >
                  {hours}h
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
                No common availability found for {selectedDuration}+ hour meetings.
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
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
                                  {duration} hour{duration !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                All available
                              </Badge>
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
    </div>
  );
}
