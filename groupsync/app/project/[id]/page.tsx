import { notFound } from 'next/navigation';
import { ProjectHeader } from '@/components/project/ProjectHeader';
import { ProjectTabs } from '@/components/project/ProjectTabs';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const member = await getProjectMember(id);
  if (!member) {
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
          guestMember: {
            select: { id: true, guestName: true },
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
          shareToken={project.shareToken}
          isOwner={!member.isGuest && project.createdById === member.userId}
          projectId={project.id}
        />
        <ProjectTabs
          projectId={project.id}
          currentUserId={member.userId || member.memberId}
          currentMemberId={member.memberId}
          isOwner={!member.isGuest && project.createdById === member.userId}
          tasks={project.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status as 'todo' | 'in_progress' | 'done',
            dueDate: task.dueDate?.toISOString() ?? null,
            assigneeName: task.assignee?.name ?? null,
            assignedTo: task.assignedTo,
            createdAt: task.createdAt.toISOString(),
          }))}
          members={project.members.map((m) => ({
            id: m.id,
            assigneeId: m.user?.id ?? null,
            name: m.user?.name || m.guestName || 'Guest',
            email: m.user?.email || null,
            avatarUrl: m.user?.avatarUrl || null,
            role: m.role,
            joinedAt: m.joinedAt.toISOString(),
          }))}
          teamAgreement={project.teamAgreement}
          availabilities={project.availability.map((avail) => {
            let slots: { day: number; startHour: number; endHour: number }[] = [];
            try {
              const parsed = JSON.parse(avail.slots);
              slots = Array.isArray(parsed) ? parsed : [];
            } catch {
              slots = [];
            }
            return {
              userId: avail.userId || avail.guestMemberId || '',
              userName: avail.user?.name || avail.guestMember?.guestName || 'Guest',
              slots,
            };
          })}
          currentUserAvailability={
            project.availability.find((a) =>
              (member.isGuest && a.guestMemberId === member.memberId) ||
              (!member.isGuest && a.userId === member.userId)
            )?.slots ?? '[]'
          }
        />
      </div>
    </main>
  );
}
