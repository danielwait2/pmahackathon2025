import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function validateBlock(day: unknown, startHour: unknown, endHour: unknown) {
  if (
    typeof day !== 'number' ||
    typeof startHour !== 'number' ||
    typeof endHour !== 'number' ||
    day < 0 ||
    day > 6 ||
    startHour < 0 ||
    startHour > 23.5 ||
    endHour <= startHour ||
    endHour > 24
  ) {
    return false;
  }
  return true;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const blocks = await prisma.userAvailabilityBlock.findMany({
    where: { userId: session.user.id },
    orderBy: [{ day: 'asc' }, { startHour: 'asc' }],
  });
  return NextResponse.json(blocks);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!validateBlock(body?.day, body?.startHour, body?.endHour)) {
    return NextResponse.json({ error: 'Invalid block' }, { status: 400 });
  }

  const created = await prisma.userAvailabilityBlock.create({
    data: {
      userId: session.user.id,
      day: body.day,
      startHour: body.startHour,
      endHour: body.endHour,
    },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const block = await prisma.userAvailabilityBlock.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!block) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (block.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.userAvailabilityBlock.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
