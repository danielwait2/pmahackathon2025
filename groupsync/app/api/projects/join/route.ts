import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const code = body.code?.toUpperCase()?.replace(/[^A-Z0-9]/g, '');

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: 'Invite code must be 6 characters' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { inviteCode: code },
    select: { id: true, name: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Invalid invite code. Check with your team.' }, { status: 404 });
  }

  const existing = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: session.user.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ alreadyMember: true, projectId: project.id, projectName: project.name });
  }

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: session.user.id,
      role: 'member',
    },
  });

  return NextResponse.json({ joined: true, projectId: project.id, projectName: project.name });
}
