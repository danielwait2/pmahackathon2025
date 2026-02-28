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
      class: {
        select: { id: true, name: true },
      },
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

  const memberUserIds = project.members
    .map((m) => m.user?.id)
    .filter((id): id is string => Boolean(id));
  const defaultRows = memberUserIds.length
    ? await prisma.userAvailabilityDefault.findMany({
        where: { userId: { in: memberUserIds } },
        select: { userId: true, slots: true },
      })
    : [];
  const defaultByUserId = new Map(defaultRows.map((row) => [row.userId, row.slots]));

  const [pendingRequests, recentCollaborators] = await Promise.all([
    prisma.projectMemberRequest.findMany({
      where: {
        projectId: project.id,
        status: 'pending',
      },
      select: { toUserId: true },
    }),
    member.userId
      ? (async () => {
          const memberships = await prisma.projectMember.findMany({
            where: { userId: member.userId },
            select: { projectId: true },
          });
          const membershipProjectIds = memberships.map((row) => row.projectId);
          if (membershipProjectIds.length === 0) {
            return [];
          }

          const collaboratorRows = await prisma.projectMember.findMany({
            where: {
              projectId: { in: membershipProjectIds },
              userId: { not: member.userId },
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { joinedAt: 'desc' },
            take: 50,
          });

          const deduped = new Map<string, { id: string; name: string; email: string | null }>();
          for (const row of collaboratorRows) {
            if (!row.user) continue;
            if (!deduped.has(row.user.id)) {
              deduped.set(row.user.id, {
                id: row.user.id,
                name: row.user.name,
                email: row.user.email,
              });
            }
          }

          return Array.from(deduped.values()).slice(0, 8);
        })()
      : Promise.resolve([]),
  ]);

  const currentUserProjectAvailability = project.availability.find((a) =>
    (member.isGuest && a.guestMemberId === member.memberId) ||
    (!member.isGuest && a.userId === member.userId)
  );
  const currentUserDefaultSlots =
    !member.isGuest && member.userId ? defaultByUserId.get(member.userId) ?? '[]' : '[]';
  const isUsingGeneralDefault = !member.isGuest && !currentUserProjectAvailability && Boolean(member.userId);

  const currentWeekStart = getCurrentWeekStart();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <ProjectHeader
          name={project.name}
          description={project.description}
          deadline={project.deadline?.toISOString() ?? null}
          className={project.class?.name ?? project.classLabel ?? null}
          isAssignment={project.isAssignment}
          inviteCode={project.inviteCode}
          memberCount={project.members.length}
          shareToken={project.shareToken}
          isOwner={!member.isGuest && project.createdById === member.userId}
          projectId={project.id}
          archivedAt={project.archivedAt?.toISOString() ?? null}
        />
        <ProjectTabs
          projectId={project.id}
          currentUserId={member.userId || member.memberId}
          currentMemberId={member.memberId}
          actualUserId={member.userId ?? member.memberId}
          isOwner={!member.isGuest && project.createdById === member.userId}
          isAssignment={project.isAssignment}
          tasks={project.tasks.map((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status as 'todo' | 'in_progress' | 'done',
            dueDate: task.dueDate?.toISOString() ?? null,
            reminderDate: task.reminderDate?.toISOString() ?? null,
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
          availabilities={project.members.map((memberRow) => {
            if (memberRow.user) {
              const explicitAvailability = project.availability.find((avail) => avail.userId === memberRow.user!.id);
              const sourceSlots = explicitAvailability?.slots ?? defaultByUserId.get(memberRow.user.id) ?? '[]';
              return {
                userId: memberRow.user.id,
                userName: memberRow.user.name,
                slots: extractWeekSlots(sourceSlots, currentWeekStart),
              };
            }

            const guestAvailability = project.availability.find((avail) => avail.guestMemberId === memberRow.id);
            return {
              userId: memberRow.id,
              userName: memberRow.guestName || 'Guest',
              slots: extractWeekSlots(guestAvailability?.slots ?? '[]', currentWeekStart),
            };
          })}
          currentUserAvailability={
            JSON.stringify(
              extractWeekSlots(
                currentUserProjectAvailability?.slots ?? currentUserDefaultSlots,
                currentWeekStart
              )
            )
          }
          isUsingGeneralDefault={isUsingGeneralDefault}
          recentCollaborators={recentCollaborators}
          pendingRequestUserIds={pendingRequests.map((request) => request.toUserId)}
        />
      </div>
    </main>
  );
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().split('T')[0];
}

function extractWeekSlots(raw: string, weekStart: string): { day: number; startHour: number; endHour: number }[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object') {
      const weekSlots = (parsed as Record<string, unknown>)[weekStart];
      return Array.isArray(weekSlots) ? (weekSlots as { day: number; startHour: number; endHour: number }[]) : [];
    }
    return [];
  } catch {
    return [];
  }
}
