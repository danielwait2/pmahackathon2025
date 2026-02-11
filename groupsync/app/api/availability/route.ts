import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = body.projectId as string | undefined;
  const slots = body.slots;

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

  if (member.isGuest) {
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
        slots: JSON.stringify(slots),
      },
      update: {
        slots: JSON.stringify(slots),
      },
    });
  } else {
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
        slots: JSON.stringify(slots),
      },
      update: {
        slots: JSON.stringify(slots),
      },
    });
  }

  return NextResponse.json(availability, { status: 200 });
}
