import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardAssignedTask, DashboardProject, ProjectMemberPreview } from '@/types';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, avatarUrl: true },
  });

  const projectMemberships = await prisma.projectMember.findMany({
    where: { userId: session.user.id },
    select: { projectId: true },
  });

  const projectIds = projectMemberships.map((m) => m.projectId);

  let projects: DashboardProject[] = [];
  let myTasks: DashboardAssignedTask[] = [];

  if (projectIds.length > 0) {
    const [projectRows, taskRows, memberRows, assignedTaskRows] = await Promise.all([
      prisma.project.findMany({
        where: { id: { in: projectIds } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { projectId: true, status: true },
      }),
      prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          assignedTo: session.user.id,
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
    ]);

    const tasksByProject: Record<string, { status: string }[]> = {};
    for (const task of taskRows) {
      if (!tasksByProject[task.projectId]) tasksByProject[task.projectId] = [];
      tasksByProject[task.projectId].push(task);
    }

    const membersByProject: Record<string, ProjectMemberPreview[]> = {};
    for (const member of memberRows) {
      if (!membersByProject[member.projectId]) membersByProject[member.projectId] = [];
      // Handle both authenticated users and guests
      if (member.user) {
        membersByProject[member.projectId].push({
          id: member.user.id,
          name: member.user.name,
          avatar_url: member.user.avatarUrl,
        });
      } else if (member.guestName) {
        // Guest member
        membersByProject[member.projectId].push({
          id: member.id,
          name: member.guestName,
          avatar_url: null,
        });
      }
    }

    projects = projectRows.map((project) => {
      const members = membersByProject[project.id] ?? [];
      const tasks = tasksByProject[project.id] ?? [];
      const completedTasks = tasks.filter((t) => t.status === 'done').length;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        deadline: project.deadline?.toISOString() ?? null,
        created_by: project.createdById,
        invite_code: project.inviteCode,
        created_at: project.createdAt.toISOString(),
        member_count: members.length,
        members,
        total_tasks: tasks.length,
        completed_tasks: completedTasks,
      };
    });

    myTasks = assignedTaskRows.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status as 'todo' | 'in_progress' | 'done',
      dueDate: task.dueDate?.toISOString() ?? null,
      projectId: task.project.id,
      projectName: task.project.name,
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DashboardShell
          userName={user?.name ?? session.user?.name ?? 'GroupSync User'}
          userEmail={user?.email ?? session.user?.email ?? ''}
          userAvatarUrl={user?.avatarUrl ?? null}
          projects={projects}
          myTasks={myTasks}
        />
      </div>
    </main>
  );
}
