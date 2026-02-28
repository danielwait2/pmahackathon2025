import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateSlots } from '@/lib/availability-validation';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const row = await prisma.userAvailabilityDefault.findUnique({
    where: { userId: session.user.id },
    select: { slots: true },
  });

  const slots = row?.slots ? JSON.parse(row.slots) : [];
  return NextResponse.json({ slots: Array.isArray(slots) ? slots : [] });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = validateSlots(body?.slots);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const saved = await prisma.userAvailabilityDefault.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      slots: JSON.stringify(validation.slots),
    },
    update: {
      slots: JSON.stringify(validation.slots),
    },
    select: { id: true, userId: true, slots: true, updatedAt: true },
  });

  return NextResponse.json(saved);
}
