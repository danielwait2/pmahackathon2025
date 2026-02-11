import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId } = await params;

  // Verify user is the project owner
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.createdById !== session.user.id) {
    return NextResponse.json(
      { error: 'Only the project owner can update the team agreement' },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Validate response time
  const responseTimeHours =
    typeof body.responseTimeHours === 'number' && body.responseTimeHours > 0
      ? body.responseTimeHours
      : 24;

  // Upsert team agreement
  const teamAgreement = await prisma.teamAgreement.upsert({
    where: { projectId },
    create: {
      projectId,
      responseTimeHours,
      meetingFrequency:
        typeof body.meetingFrequency === 'string' ? body.meetingFrequency || null : null,
      communicationChannel:
        typeof body.communicationChannel === 'string' ? body.communicationChannel || null : null,
      qualityStandards:
        typeof body.qualityStandards === 'string' ? body.qualityStandards || null : null,
      agreedBy: '[]', // Reset agreements when agreement is created
    },
    update: {
      responseTimeHours,
      meetingFrequency:
        typeof body.meetingFrequency === 'string' ? body.meetingFrequency || null : null,
      communicationChannel:
        typeof body.communicationChannel === 'string' ? body.communicationChannel || null : null,
      qualityStandards:
        typeof body.qualityStandards === 'string' ? body.qualityStandards || null : null,
      // Don't reset agreedBy on update - keep existing agreements
    },
  });

  return NextResponse.json(teamAgreement, { status: 200 });
}

export async function GET(_request: Request, { params }: RouteProps) {
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

  return NextResponse.json(teamAgreement, { status: 200 });
}
