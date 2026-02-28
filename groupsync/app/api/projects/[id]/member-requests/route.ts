import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await params;
  const body = await request.json();
  const toUserId = typeof body?.toUserId === 'string' ? body.toUserId.trim() : '';

  if (!toUserId) {
    return NextResponse.json({ error: 'toUserId is required' }, { status: 400 });
  }

  if (toUserId === session.user.id) {
    return NextResponse.json({ error: 'You are already a member' }, { status: 400 });
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Not authorized for this project' }, { status: 403 });
  }

  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: toUserId,
      },
    },
    select: { id: true },
  });

  if (existingMember) {
    return NextResponse.json({ error: 'User is already in this project' }, { status: 400 });
  }

  const pending = await prisma.projectMemberRequest.findFirst({
    where: { projectId, toUserId, status: 'pending' },
    select: { id: true },
  });

  if (pending) {
    return NextResponse.json({ error: 'Invite already pending' }, { status: 409 });
  }

  const created = await prisma.projectMemberRequest.create({
    data: {
      projectId,
      fromUserId: session.user.id,
      toUserId,
      status: 'pending',
    },
    select: {
      id: true,
      projectId: true,
      fromUserId: true,
      toUserId: true,
      status: true,
      createdAt: true,
      respondedAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
