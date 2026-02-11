'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AvailabilityTab } from '@/components/project/AvailabilityTab';
import { ProjectTaskItem, TasksTab } from '@/components/project/TasksTab';
import { TeamMemberItem, TeamTab } from '@/components/project/TeamTab';

interface TeamAgreementItem {
  responseTimeHours: number;
  meetingFrequency: string | null;
  communicationChannel: string | null;
  qualityStandards: string | null;
}

interface ProjectTabsProps {
  tasks: ProjectTaskItem[];
  members: TeamMemberItem[];
  teamAgreement: TeamAgreementItem | null;
}

export function ProjectTabs({ tasks, members, teamAgreement }: ProjectTabsProps) {
  return (
    <Tabs defaultValue="tasks" className="space-y-4">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TasksTab tasks={tasks} />
      </TabsContent>
      <TabsContent value="availability">
        <AvailabilityTab memberCount={members.length} />
      </TabsContent>
      <TabsContent value="team">
        <TeamTab members={members} teamAgreement={teamAgreement} />
      </TabsContent>
    </Tabs>
  );
}
