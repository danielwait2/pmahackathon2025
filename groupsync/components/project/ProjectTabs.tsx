'use client';

import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AvailabilityTab } from '@/components/project/AvailabilityTab';
import { ProjectTaskItem, TasksTab } from '@/components/project/TasksTab';
import { TeamMemberItem, TeamTab } from '@/components/project/TeamTab';
import { type UserAvailability } from './availability-utils';

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
  currentMemberId: string;
  actualUserId: string | null;
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
  currentMemberId,
  actualUserId,
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
          members={members
            .filter((m) => m.assigneeId)
            .map((m) => ({ id: m.assigneeId!, name: m.name }))}
          onRefresh={handleRefresh}
        />
      </TabsContent>

      <TabsContent value="availability">
        <AvailabilityTab
          projectId={projectId}
          currentUserId={actualUserId}
          initialSlots={currentUserAvailability}
          teamAvailabilities={availabilities}
        />
      </TabsContent>

      <TabsContent value="team">
        <TeamTab
          projectId={projectId}
          currentUserId={currentUserId}
          currentMemberId={currentMemberId}
          isOwner={isOwner}
          members={members}
          teamAgreement={
            teamAgreement
              ? {
                  id: teamAgreement.id,
                  responseTimeHours: teamAgreement.responseTimeHours,
                  meetingFrequency: teamAgreement.meetingFrequency,
                  communicationChannel: teamAgreement.communicationChannel,
                  qualityStandards: teamAgreement.qualityStandards,
                  agreedBy: (() => {
                    try {
                      const parsed = JSON.parse(teamAgreement.agreedBy);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  })(),
                  updatedAt: teamAgreement.updatedAt.toISOString(),
                }
              : null
          }
          onRefresh={handleRefresh}
        />
      </TabsContent>
    </Tabs>
  );
}
