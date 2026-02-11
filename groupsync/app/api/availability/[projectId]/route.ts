import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function GET(_request: Request, { params }: RouteProps) {
  const { projectId } = await params;

  const member = await getProjectMember(projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch all availability for this project with user and guest member details
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
      guestMember: {
        select: {
          id: true,
          guestName: true,
        },
      },
    },
  });

  // Transform to a more usable format
  const formattedAvailabilities = availabilities.map((avail) => ({
    userId: avail.userId || avail.guestMemberId,
    userName: avail.user?.name || avail.guestMember?.guestName || 'Guest',
    userEmail: avail.user?.email || null,
    isGuest: !avail.userId,
    slots: avail.slots, // JSON string
    updatedAt: avail.updatedAt.toISOString(),
  }));

  return NextResponse.json(formattedAvailabilities, { status: 200 });
}
