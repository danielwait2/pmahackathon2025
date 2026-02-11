import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify user is a member of the project
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

  // Fetch all availability for this project with user details
  const availabilities = await prisma.availability.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Transform to a more usable format
  const formattedAvailabilities = availabilities.map((avail) => ({
    userId: avail.userId,
    userName: avail.user.name,
    userEmail: avail.user.email,
    slots: avail.slots, // JSON string
    updatedAt: avail.updatedAt.toISOString(),
  }));

  return NextResponse.json(formattedAvailabilities, { status: 200 });
}
