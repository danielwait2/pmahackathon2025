import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

export async function POST(request: Request) {
  const body = await request.json();
  const projectId = body.projectId as string | undefined;
  const title = (body.title as string | undefined)?.trim();

  if (!projectId || !title) {
    return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
  }

  const member = await getProjectMember(projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentMax = await prisma.task.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  });

  const status = typeof body.status === 'string' && allowedStatuses.has(body.status) ? body.status : 'todo';
  const dueDate = body.dueDate ? new Date(body.dueDate) : null;
  const reminderDate = body.reminderDate ? new Date(body.reminderDate) : null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { isPersonal: true },
  });

  let assignedTo: string | null = null;
  if (project?.isPersonal && member.userId) {
    assignedTo = member.userId;
  } else if (typeof body.assignedTo === 'string' && body.assignedTo.length > 0) {
    assignedTo = body.assignedTo;
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      assignedTo,
      status,
      dueDate,
      reminderDate,
      orderIndex: (currentMax._max.orderIndex ?? -1) + 1,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
