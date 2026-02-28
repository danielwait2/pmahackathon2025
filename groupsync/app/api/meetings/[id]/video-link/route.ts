import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getValidGoogleAccessToken } from '@/lib/google-calendar';

interface RouteProps {
  params: Promise<{ id: string }>;
}

async function createGoogleMeetLink(userId: string, meeting: { title: string; date: string; startTime: string; endTime: string }) {
  const token = await getValidGoogleAccessToken(userId);
  if (!token) {
    throw new Error('Google Calendar is not connected');
  }

  const startDateTime = `${meeting.date}T${meeting.startTime}:00`;
  const endDateTime = `${meeting.date}T${meeting.endTime}:00`;

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      summary: meeting.title,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
      conferenceData: {
        createRequest: {
          requestId: crypto.randomUUID(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to create Google Meet link');
  }

  const data = await response.json();
  return (data.hangoutLink as string | undefined) ?? null;
}

function createZoomPlaceholderLink(meetingId: string) {
  return `https://zoom.us/j/${meetingId.replace(/-/g, '').slice(0, 11)}`;
}

export async function POST(request: Request, { params }: RouteProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const provider = body?.provider;
  if (provider !== 'google' && provider !== 'zoom') {
    return NextResponse.json({ error: 'provider must be google or zoom' }, { status: 400 });
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          createdById: true,
          members: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const isProjectOwner = meeting.project.createdById === session.user.id;
  const isMeetingCreator = meeting.createdById === session.user.id;
  const isMember = meeting.project.members.length > 0;
  if (!isMember || (!isProjectOwner && !isMeetingCreator)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const videoUrl =
      provider === 'google'
        ? await createGoogleMeetLink(session.user.id, meeting)
        : createZoomPlaceholderLink(meeting.id);

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video link returned' }, { status: 400 });
    }

    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: { videoUrl },
      select: { id: true, videoUrl: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create video link' },
      { status: 400 }
    );
  }
}
