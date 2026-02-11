import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify user is a member
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

  // Get team agreement
  const teamAgreement = await prisma.teamAgreement.findUnique({
    where: { projectId },
  });

  if (!teamAgreement) {
    return NextResponse.json({ error: 'Team agreement not found' }, { status: 404 });
  }

  // Parse current agreedBy array
  let agreedBy: string[] = [];
  try {
    const parsed = JSON.parse(teamAgreement.agreedBy);
    agreedBy = Array.isArray(parsed) ? parsed : [];
  } catch {
    agreedBy = [];
  }

  // Check if user already agreed
  if (agreedBy.includes(session.user.id)) {
    return NextResponse.json(
      { message: 'You have already agreed to this team agreement' },
      { status: 200 }
    );
  }

  // Add user to agreedBy array
  agreedBy.push(session.user.id);

  // Update team agreement
  const updated = await prisma.teamAgreement.update({
    where: { projectId },
    data: {
      agreedBy: JSON.stringify(agreedBy),
    },
  });

  return NextResponse.json(
    { message: 'Successfully agreed to team agreement', teamAgreement: updated },
    { status: 200 }
  );
}
