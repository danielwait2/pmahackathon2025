'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, CalendarPlus, Clock, ExternalLink, Trash2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  createCalendarEventFromMeeting,
  downloadIcsFile,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
} from '@/lib/calendar-utils';

interface Meeting {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  createdById: string | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
}

interface UpcomingMeetingsProps {
  projectId: string;
  currentUserId: string | null;
  refreshTrigger?: number;
}

export function UpcomingMeetings({ projectId, currentUserId, refreshTrigger = 0 }: UpcomingMeetingsProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/meetings?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings, refreshTrigger]);

  const handleDelete = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) {
      return;
    }

    setDeletingId(meetingId);
    try {
      const response = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMeetings(meetings.filter((m) => m.id !== meetingId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete meeting');
      }
    } catch {
      alert('Failed to delete meeting');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const totalMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    if (totalMinutes <= 0) return null;
    if (totalMinutes < 60) return `${totalMinutes} min`;
    if (totalMinutes % 60 === 0) {
      const hours = totalMinutes / 60;
      return `${hours}h`;
    }
    return `${totalMinutes / 60}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-slate-600">
          Loading meetings...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upcoming Meetings</CardTitle>
      </CardHeader>
      <CardContent>
        {meetings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600">No meetings scheduled yet</p>
            <p className="text-xs text-slate-500 mt-2">
              Use the Meeting Finder to schedule your first team meeting
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => {
              const isCreator = currentUserId && meeting.createdById === currentUserId;
              return (
                <div
                  key={meeting.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">
                        {meeting.title}
                      </h3>

                      <div className="flex flex-col gap-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(meeting.date)}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                          </span>
                          {formatDuration(meeting.startTime, meeting.endTime) && (
                            <Badge variant="outline" className="text-[10px]">
                              {formatDuration(meeting.startTime, meeting.endTime)}
                            </Badge>
                          )}
                        </div>

                        {meeting.createdBy && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>Created by {meeting.createdBy.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <div className="hidden md:flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            const event = createCalendarEventFromMeeting(meeting);
                            window.open(getGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Google
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            const event = createCalendarEventFromMeeting(meeting);
                            window.open(getOutlookCalendarUrl(event), '_blank', 'noopener,noreferrer');
                          }}
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Outlook
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            const event = createCalendarEventFromMeeting(meeting);
                            downloadIcsFile(event, `${meeting.title.replace(/\s+/g, '-').toLowerCase() || 'meeting'}.ics`);
                          }}
                        >
                          <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                          Apple
                        </Button>
                      </div>
                      {isCreator && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                      {isCreator && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(meeting.id)}
                          disabled={deletingId === meeting.id}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex md:hidden gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const event = createCalendarEventFromMeeting(meeting);
                        window.open(getGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const event = createCalendarEventFromMeeting(meeting);
                        window.open(getOutlookCalendarUrl(event), '_blank', 'noopener,noreferrer');
                      }}
                    >
                      Outlook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const event = createCalendarEventFromMeeting(meeting);
                        downloadIcsFile(event, `${meeting.title.replace(/\s+/g, '-').toLowerCase() || 'meeting'}.ics`);
                      }}
                    >
                      Apple
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
