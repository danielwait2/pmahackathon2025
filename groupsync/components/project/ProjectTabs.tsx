'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Availability, Project, ProjectMember, Task, TeamAgreement } from '@/types';

import { AvailabilityTab } from '@/components/project/AvailabilityTab';
import { TeamTab } from '@/components/project/TeamTab';
import { TasksTab } from '@/components/project/TasksTab';

interface ProjectTabsProps {
  project: Project;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  tasks: Task[];
  availability: Availability[];
  teamAgreement: TeamAgreement | null;
  currentUserId: string;
  isOwner: boolean;
}

export function ProjectTabs({
  project,
  members,
  tasks,
  availability,
  teamAgreement,
  currentUserId,
  isOwner,
}: ProjectTabsProps) {
  const [tab, setTab] = useState('overview');

  const stats = useMemo(() => {
    const done = tasks.filter((task) => task.status === 'done').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    return { done, inProgress, total: tasks.length };
  }, [tasks]);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.due_date)
        .sort((a, b) => new Date(a.due_date ?? '').getTime() - new Date(b.due_date ?? '').getTime())
        .slice(0, 4),
    [tasks]
  );

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Tasks Done</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-slate-900">{stats.done}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-slate-900">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">Team Members</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-black text-slate-900">{members.length}</p>
              <Users className="h-5 w-5 text-slate-400" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>Response time: {teamAgreement?.response_time_hours ?? 24} hours</p>
              <p>Meeting cadence: {teamAgreement?.meeting_frequency ?? 'Weekly'}</p>
              <p>Communication: {teamAgreement?.communication_channel ?? 'Discord'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Task Deadlines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.length === 0 && <p className="text-sm text-slate-500">No task deadlines yet.</p>}
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                  <span className="font-medium text-slate-900">{task.title}</span>
                  <span className="text-slate-500">{task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No due date'}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="tasks">
        <TasksTab
          project={project}
          members={members}
          initialTasks={tasks}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="availability">
        <AvailabilityTab
          projectId={project.id}
          members={members}
          availability={availability}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      </TabsContent>

      <TabsContent value="team">
        <TeamTab
          projectId={project.id}
          inviteCode={project.invite_code}
          members={members}
          initialAgreement={teamAgreement}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      </TabsContent>
    </Tabs>
  );
}
