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
  const action = body?.action;

  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'action must be accept or decline' }, { status: 400 });
  }

  const invite = await prisma.projectMemberRequest.findUnique({
    where: { id },
    select: {
      id: true,
      projectId: true,
      toUserId: true,
      status: true,
    },
  });

  if (!invite) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  if (invite.toUserId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invite already handled' }, { status: 400 });
  }

  if (action === 'decline') {
    const declined = await prisma.projectMemberRequest.update({
      where: { id },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      },
      select: { id: true, status: true },
    });
    return NextResponse.json(declined);
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectMemberRequest.update({
      where: { id },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
      },
    });

    await tx.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: session.user.id,
        },
      },
      create: {
        projectId: invite.projectId,
        userId: session.user.id,
        role: 'member',
      },
      update: {},
    });
  });

  return NextResponse.json({ id, status: 'accepted' });
}
