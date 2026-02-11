import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = body.projectId as string | undefined;
  const slots = body.slots;
  const weekStart = body.weekStart as string | undefined;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  if (!Array.isArray(slots)) {
    return NextResponse.json({ error: 'slots must be an array' }, { status: 400 });
  }

  const member = await getProjectMember(projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate slots structure
  for (const slot of slots) {
    if (
      typeof slot.day !== 'number' ||
      typeof slot.startHour !== 'number' ||
      typeof slot.endHour !== 'number' ||
      slot.day < 0 ||
      slot.day > 6 ||
      slot.startHour < 0 ||
      slot.startHour > 23 ||
      slot.endHour < 0 ||
      slot.endHour > 24 ||
      slot.startHour >= slot.endHour
    ) {
      return NextResponse.json(
        { error: 'Invalid slot format. Each slot must have day (0-6), startHour (0-23), and endHour (0-24)' },
        { status: 400 }
      );
    }
  }

  // Upsert availability (create or update)
  let availability;
  const currentWeekStart = getCurrentWeekStart();

  const mergeSlotsByWeek = (existingSlots: string | null): string => {
    if (!weekStart) {
      return JSON.stringify(slots);
    }

    const parsed = safeJsonParse(existingSlots);
    let byWeek: Record<string, unknown> = {};

    if (Array.isArray(parsed)) {
      byWeek[currentWeekStart] = parsed;
    } else if (parsed && typeof parsed === 'object') {
      byWeek = { ...(parsed as Record<string, unknown>) };
    }

    byWeek[weekStart] = slots;
    return JSON.stringify(byWeek);
  };

  if (member.isGuest) {
    const existing = await prisma.availability.findUnique({
      where: {
        projectId_guestMemberId: {
          projectId,
          guestMemberId: member.memberId,
        },
      },
      select: { slots: true },
    });

    // Guest member - use guestMemberId unique key
    availability = await prisma.availability.upsert({
      where: {
        projectId_guestMemberId: {
          projectId,
          guestMemberId: member.memberId,
        },
      },
      create: {
        projectId,
        userId: null,
        guestMemberId: member.memberId,
        slots: mergeSlotsByWeek(existing?.slots ?? null),
      },
      update: {
        slots: mergeSlotsByWeek(existing?.slots ?? null),
      },
    });
  } else {
    const existing = await prisma.availability.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: member.userId!,
        },
      },
      select: { slots: true },
    });

    // Authenticated user - use userId unique key
    availability = await prisma.availability.upsert({
      where: {
        projectId_userId: {
          projectId,
          userId: member.userId!,
        },
      },
      create: {
        projectId,
        userId: member.userId!,
        guestMemberId: null,
        slots: mergeSlotsByWeek(existing?.slots ?? null),
      },
      update: {
        slots: mergeSlotsByWeek(existing?.slots ?? null),
      },
    });
  }

  return NextResponse.json(availability, { status: 200 });
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

function safeJsonParse(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
