'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvailabilityGrid } from './AvailabilityGrid';
import { TeamAvailability } from './TeamAvailability';
import { MeetingFinder } from './MeetingFinder';
import { UpcomingMeetings } from './UpcomingMeetings';
import { jsonToSlots, slotsToJson, type TimeSlot, type UserAvailability } from './availability-utils';

interface AvailabilityTabProps {
  projectId: string;
  currentUserId: string | null;
  initialSlots: string; // JSON string from database
  teamAvailabilities: UserAvailability[];
  onSave?: (slots: TimeSlot[]) => Promise<void>;
}

export function AvailabilityTab({
  projectId,
  currentUserId,
  initialSlots,
  teamAvailabilities,
  onSave,
}: AvailabilityTabProps) {
  const [mySlots, setMySlots] = useState<TimeSlot[]>(() => jsonToSlots(initialSlots));
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [meetingRefreshTrigger, setMeetingRefreshTrigger] = useState(0);

  const handleSlotsChange = (newSlots: TimeSlot[]) => {
    setMySlots(newSlots);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(mySlots);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save availability:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMeetingScheduled = () => {
    setMeetingRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="my-availability" className="w-full">
        <TabsList>
          <TabsTrigger value="my-availability">My Availability</TabsTrigger>
          <TabsTrigger value="team-view">Team View</TabsTrigger>
          <TabsTrigger value="meeting-finder">Meeting Finder</TabsTrigger>
        </TabsList>

        <TabsContent value="my-availability" className="space-y-4">
          <AvailabilityGrid slots={mySlots} onChange={handleSlotsChange} />

          {hasChanges && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save My Availability'}
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="team-view">
          <TeamAvailability availabilities={teamAvailabilities} />
        </TabsContent>

        <TabsContent value="meeting-finder" className="space-y-4">
          <UpcomingMeetings
            projectId={projectId}
            currentUserId={currentUserId}
            refreshTrigger={meetingRefreshTrigger}
          />
          <MeetingFinder
            projectId={projectId}
            availabilities={teamAvailabilities}
            minDuration={1}
            onMeetingScheduled={handleMeetingScheduled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
