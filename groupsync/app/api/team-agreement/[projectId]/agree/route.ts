import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

interface RouteProps {
  params: Promise<{ projectId: string }>;
}

export async function POST(_request: Request, { params }: RouteProps) {
  const { projectId } = await params;

  const member = await getProjectMember(projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  // Check if member already agreed (use memberId for both users and guests)
  if (agreedBy.includes(member.memberId)) {
    return NextResponse.json(
      { message: 'You have already agreed to this team agreement' },
      { status: 200 }
    );
  }

  // Add member to agreedBy array
  agreedBy.push(member.memberId);

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
