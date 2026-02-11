'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AvailabilityTab } from '@/components/project/AvailabilityTab';
import { ProjectTaskItem, TasksTab } from '@/components/project/TasksTab';
import { TeamMemberItem, TeamTab } from '@/components/project/TeamTab';
import { type UserAvailability, type TimeSlot } from './availability-utils';

interface TeamAgreementData {
  id: string;
  responseTimeHours: number;
  meetingFrequency: string | null;
  communicationChannel: string | null;
  qualityStandards: string | null;
  agreedBy: string;
  updatedAt: Date;
}

interface ProjectTabsProps {
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
  tasks: ProjectTaskItem[];
  members: TeamMemberItem[];
  teamAgreement: TeamAgreementData | null;
  availabilities: UserAvailability[];
  currentUserAvailability: string;
}

export function ProjectTabs({
  projectId,
  currentUserId,
  isOwner,
  tasks,
  members,
  teamAgreement,
  availabilities,
  currentUserAvailability,
}: ProjectTabsProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSaveAvailability = async (slots: TimeSlot[]) => {
    const response = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        slots,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save availability');
    }

    router.refresh();
  };

  return (
    <Tabs defaultValue="tasks" className="space-y-4">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TasksTab
          projectId={projectId}
          tasks={tasks}
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="availability">
        <AvailabilityTab
          projectId={projectId}
          currentUserId={currentUserId}
          initialSlots={currentUserAvailability}
          teamAvailabilities={availabilities}
          onSave={handleSaveAvailability}
        />
      </TabsContent>

      <TabsContent value="team">
        <TeamTab
          members={members}
          teamAgreement={
            teamAgreement
              ? {
                  responseTimeHours: teamAgreement.responseTimeHours,
                  meetingFrequency: teamAgreement.meetingFrequency,
                  communicationChannel: teamAgreement.communicationChannel,
                  qualityStandards: teamAgreement.qualityStandards,
                }
              : null
          }
        />
      </TabsContent>
    </Tabs>
  );
}
