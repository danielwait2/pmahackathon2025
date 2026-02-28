import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { projectId } = await params;
  const { searchParams } = new URL(_request.url);
  const weekStart = searchParams.get('weekStart') || getCurrentWeekStart();

  const member = await getProjectMember(projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all availability for this project with user and guest member details
  const [members, availabilities] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.availability.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        guestMember: {
          select: {
            id: true,
            guestName: true,
          },
        },
      },
    }),
  ]);

  const userIds = members.map((m) => m.userId).filter((id): id is string => Boolean(id));
  const defaults = userIds.length
    ? await prisma.userAvailabilityDefault.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, slots: true, updatedAt: true },
      })
    : [];
  const defaultByUserId = new Map(defaults.map((row) => [row.userId, row]));
  const availabilityByUserId = new Map(
    availabilities.filter((row) => row.userId).map((row) => [row.userId!, row])
  );
  const availabilityByGuestId = new Map(
    availabilities.filter((row) => row.guestMemberId).map((row) => [row.guestMemberId!, row])
  );

  const formattedAvailabilities = members.map((memberRow) => {
    if (memberRow.userId && memberRow.user) {
      const explicit = availabilityByUserId.get(memberRow.userId);
      const fallback = defaultByUserId.get(memberRow.userId);
      const slotsRaw = explicit?.slots ?? fallback?.slots ?? '[]';
      return {
        userId: memberRow.userId,
        userName: memberRow.user.name,
        userEmail: memberRow.user.email,
        isGuest: false,
        slots: extractSlotsForWeek(slotsRaw, weekStart),
        updatedAt: (explicit?.updatedAt ?? fallback?.updatedAt ?? new Date()).toISOString(),
      };
    }

    const guestAvailability = availabilityByGuestId.get(memberRow.id);
    return {
      userId: memberRow.id,
      userName: memberRow.guestName || 'Guest',
      userEmail: null,
      isGuest: true,
      slots: extractSlotsForWeek(guestAvailability?.slots ?? '[]', weekStart),
      updatedAt: (guestAvailability?.updatedAt ?? new Date()).toISOString(),
    };
  });

  return NextResponse.json(formattedAvailabilities, { status: 200 });
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

function extractSlotsForWeek(raw: string, weekStart: string) {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object') {
      const weekSlots = (parsed as Record<string, unknown>)[weekStart];
      return Array.isArray(weekSlots) ? weekSlots : [];
    }
    return [];
  } catch {
    return [];
  }
}
