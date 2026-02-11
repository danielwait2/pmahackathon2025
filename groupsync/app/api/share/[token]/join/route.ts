import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setGuestMemberCookie } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = await request.json();
  const guestName = body.name?.trim();

  if (!guestName || guestName.length < 1) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { shareToken: token },
    select: { id: true, name: true }
  });

  if (!project) {
    return NextResponse.json(
      { error: 'Invalid or expired share link' },
      { status: 404 }
    );
  }

  // Check if guest with this name already exists
  const existingMember = await prisma.projectMember.findFirst({
    where: {
      projectId: project.id,
      userId: null,
      guestName
    },
    select: { id: true }
  });

  let memberId: string;

  if (existingMember) {
    // Returning guest - reuse existing member record
    memberId = existingMember.id;
  } else {
    // New guest - create member and availability records
    const member = await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: null,
        guestName,
        role: 'member'
      }
    });

    // Create availability record for the new guest
    await prisma.availability.create({
      data: {
        projectId: project.id,
        userId: null,
        guestMemberId: member.id,
        slots: '[]'
      }
    });

    memberId = member.id;
  }

  // Set guest cookie
  await setGuestMemberCookie(project.id, memberId);

  return NextResponse.json({
    success: true,
    projectId: project.id,
    projectName: project.name,
    memberId,
    isReturning: !!existingMember
  });
}
