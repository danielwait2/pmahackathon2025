import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const projectId = body.projectId as string | undefined;
  const slots = body.slots;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  if (!Array.isArray(slots)) {
    return NextResponse.json({ error: 'slots must be an array' }, { status: 400 });
  }

  // Verify user is a member of the project
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  const availability = await prisma.availability.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
    create: {
      projectId,
      userId: session.user.id,
      slots: JSON.stringify(slots),
    },
    update: {
      slots: JSON.stringify(slots),
    },
  });

  return NextResponse.json(availability, { status: 200 });
}
