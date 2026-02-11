import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: meetingId } = await params;

  if (!meetingId) {
    return NextResponse.json({ error: 'Meeting ID is required' }, { status: 400 });
  }

  // First, get the meeting to check project membership and creator
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    select: {
      id: true,
      projectId: true,
      createdById: true,
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  // Check if user is a member of the project
  const member = await getProjectMember(meeting.projectId);
  if (!member) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is the creator (only creator can delete)
  if (meeting.createdById !== member.userId) {
    return NextResponse.json(
      { error: 'Only the meeting creator can delete this meeting' },
      { status: 403 }
    );
  }

  await prisma.meeting.delete({
    where: { id: meetingId },
  });

  return NextResponse.json({ success: true });
}
