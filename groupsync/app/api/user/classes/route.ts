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

  const userClasses = await prisma.userClass.findMany({
    where: { userId: session.user.id },
    include: {
      class: {
        select: { id: true, name: true },
      },
    },
    orderBy: { class: { name: 'asc' } },
  });

  return NextResponse.json(
    userClasses.map((row) => ({
      id: row.id,
      classId: row.class.id,
      name: row.class.name,
    }))
  );
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

  const cls = await prisma.class.upsert({
    where: { name: normalizedName },
    create: { name: normalizedName },
    update: {},
    select: { id: true, name: true },
  });

  const userClass = await prisma.userClass.upsert({
    where: {
      userId_classId: {
        userId: session.user.id,
        classId: cls.id,
      },
    },
    create: {
      userId: session.user.id,
      classId: cls.id,
    },
    update: {},
    select: { id: true, classId: true },
  });

  return NextResponse.json({
    id: userClass.id,
    classId: userClass.classId,
    name: cls.name,
  });
}
