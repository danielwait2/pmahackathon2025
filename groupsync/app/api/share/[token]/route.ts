import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ token: string }>;
}

// GET - Retrieve project info by share token (public endpoint)
export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  const project = await prisma.project.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        where: { userId: null },
        select: { guestName: true },
        orderBy: { joinedAt: 'desc' }
      }
    }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Invalid or expired share link' },
      { status: 404 }
    );
  }

  const existingGuestNames = project.members
    .map(m => m.guestName)
    .filter((name): name is string => name !== null);

  return NextResponse.json({
    projectId: project.id,
    projectName: project.name,
    projectDescription: project.description,
    existingGuestNames
  });
}
