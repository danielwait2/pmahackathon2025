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
  const availabilities = await prisma.availability.findMany({
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
  });

  // Transform to a more usable format
  const formattedAvailabilities = availabilities.map((avail) => ({
    userId: avail.userId || avail.guestMemberId,
    userName: avail.user?.name || avail.guestMember?.guestName || 'Guest',
    userEmail: avail.user?.email || null,
    isGuest: !avail.userId,
    slots: extractSlotsForWeek(avail.slots, weekStart),
    updatedAt: avail.updatedAt.toISOString(),
  }));

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
      return weekStart === getCurrentWeekStart() ? parsed : [];
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
