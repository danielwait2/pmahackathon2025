import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const projectId = body.projectId as string | undefined;
  const title = (body.title as string | undefined)?.trim();

  if (!projectId || !title) {
    return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
  }

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

  const currentMax = await prisma.task.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  });

  const status = typeof body.status === 'string' && allowedStatuses.has(body.status) ? body.status : 'todo';
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      assignedTo: typeof body.assignedTo === 'string' && body.assignedTo.length > 0 ? body.assignedTo : null,
      status,
      dueDate,
      orderIndex: (currentMax._max.orderIndex ?? -1) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
