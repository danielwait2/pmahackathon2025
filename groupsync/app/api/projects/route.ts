import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, deadline, responseTimeHours, meetingFrequency, communicationChannel } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  let inviteCode = generateInviteCode();
  // Ensure uniqueness
  while (await prisma.project.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      deadline: deadline ? new Date(deadline) : null,
      createdById: session.user.id,
      inviteCode,
      members: {
        create: {
          userId: session.user.id,
          role: 'owner',
        },
      },
      teamAgreement: {
        create: {
          responseTimeHours: responseTimeHours ?? 24,
          meetingFrequency: meetingFrequency ?? null,
          communicationChannel: communicationChannel ?? null,
        },
      },
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
    },
  });

  return NextResponse.json(project);
}
