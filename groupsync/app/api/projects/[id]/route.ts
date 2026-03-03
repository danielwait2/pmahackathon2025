import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const archived = body?.archived === true;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, createdById: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.createdById !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      archivedAt: archived ? new Date() : null,
    },
    select: {
      id: true,
      name: true,
      archivedAt: true,
    },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    archivedAt: updated.archivedAt?.toISOString() ?? null,
  });
}
