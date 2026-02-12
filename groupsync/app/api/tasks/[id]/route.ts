import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

interface RouteProps {
  params: Promise<{ id: string }>;
}

async function getAuthorizedTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });

  if (!task) {
    return { task: null, authorized: false };
  }

  const member = await getProjectMember(task.projectId);
  return { task, authorized: Boolean(member) };
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const { task, authorized } = await getAuthorizedTask(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const data: {
    title?: string;
    description?: string | null;
    assignedTo?: string | null;
    status?: string;
    dueDate?: Date | null;
    reminderDate?: Date | null;
    orderIndex?: number;
  } = {};

  if (typeof body.title === 'string') {
    data.title = body.title.trim();
  }
  if (typeof body.description === 'string' || body.description === null) {
    data.description = typeof body.description === 'string' ? body.description.trim() || null : null;
  }
  if (typeof body.assignedTo === 'string' || body.assignedTo === null) {
    data.assignedTo = body.assignedTo || null;
  }
  if (typeof body.status === 'string') {
    if (!allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    data.status = body.status;
  }
  if (typeof body.orderIndex === 'number') {
    data.orderIndex = body.orderIndex;
  }
  if (typeof body.dueDate === 'string' || body.dueDate === null) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (typeof body.reminderDate === 'string' || body.reminderDate === null) {
    data.reminderDate = body.reminderDate ? new Date(body.reminderDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const { task, authorized } = await getAuthorizedTask(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.task.delete({ where: { id: task.id } });
  return NextResponse.json({ deleted: true });
}
