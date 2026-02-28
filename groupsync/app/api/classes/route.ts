import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeClassName } from '@/lib/class-utils';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const classes = await prisma.class.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(classes);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const normalizedName = normalizeClassName(typeof body?.name === 'string' ? body.name : '');

  if (!normalizedName) {
    return NextResponse.json({ error: 'Class name cannot be empty' }, { status: 400 });
  }

  const existing = await prisma.class.findUnique({
    where: { name: normalizedName },
    select: { id: true, name: true, createdAt: true },
  });

  if (existing) {
    await prisma.userClass.upsert({
      where: {
        userId_classId: {
          userId: session.user.id,
          classId: existing.id,
        },
      },
      create: {
        userId: session.user.id,
        classId: existing.id,
      },
      update: {},
    });
    return NextResponse.json(existing);
  }

  try {
    const created = await prisma.class.create({
      data: { name: normalizedName },
      select: { id: true, name: true, createdAt: true },
    });

    await prisma.userClass.upsert({
      where: {
        userId_classId: {
          userId: session.user.id,
          classId: created.id,
        },
      },
      create: {
        userId: session.user.id,
        classId: created.id,
      },
      update: {},
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    const recovered = await prisma.class.findUnique({
      where: { name: normalizedName },
      select: { id: true, name: true, createdAt: true },
    });

    if (recovered) {
      return NextResponse.json(recovered);
    }

    return NextResponse.json({ error: 'Unable to create class' }, { status: 500 });
  }
}
