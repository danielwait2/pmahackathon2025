import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectTabs } from '@/components/project/ProjectTabs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'asc' }],
        include: {
          assignee: {
            select: { id: true, name: true },
          },
        },
      },
      members: {
        orderBy: { joinedAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      teamAgreement: true,
      availability: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <ProjectHeader
          name={project.name}
          description={project.description}
          deadline={project.deadline?.toISOString() ?? null}
          inviteCode={project.inviteCode}
          memberCount={project.members.length}
        />
        <ProjectTabs
          projectId={project.id}
          currentUserId={session.user.id}
          isOwner={project.createdById === session.user.id}
          tasks={project.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            dueDate: task.dueDate?.toISOString() ?? null,
            assigneeName: task.assignee?.name ?? null,
            assignedTo: task.assignedTo,
            createdAt: task.createdAt.toISOString(),
          }))}
          members={project.members.map((member) => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl,
            role: member.role,
            joinedAt: member.joinedAt.toISOString(),
          }))}
          teamAgreement={project.teamAgreement}
          availabilities={project.availability.map((avail) => ({
            userId: avail.userId,
            userName: avail.user.name,
            slots: JSON.parse(avail.slots),
          }))}
          currentUserAvailability={
            project.availability.find((a) => a.userId === session.user.id)?.slots ?? '[]'
          }
        />
      </div>
    </main>
  );
}
