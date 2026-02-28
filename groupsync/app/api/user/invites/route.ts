import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invites = await prisma.projectMemberRequest.findMany({
    where: {
      toUserId: session.user.id,
      status: 'pending',
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
      fromUser: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    invites.map((invite) => ({
      id: invite.id,
      projectId: invite.projectId,
      projectName: invite.project.name,
      fromUserId: invite.fromUserId,
      fromUserName: invite.fromUser.name,
      status: invite.status,
      createdAt: invite.createdAt.toISOString(),
    }))
  );
}
