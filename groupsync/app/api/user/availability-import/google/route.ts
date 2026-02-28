import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchGoogleBusyTimes } from '@/lib/google-calendar';

interface TimeSlot {
  day: number;
  startHour: number;
  endHour: number;
}

function buildFullDayTemplate() {
  const byDay = new Map<number, boolean[]>();
  for (let day = 0; day < 7; day++) {
    byDay.set(day, Array(48).fill(false));
    for (let h = 12; h < 46; h++) {
      byDay.get(day)![h] = true; // 6:00 - 23:00 defaults available
    }
  }
  return byDay;
}

function halfHourIndexFromDate(date: Date) {
  return Math.max(0, Math.min(48, Math.floor((date.getUTCHours() * 60 + date.getUTCMinutes()) / 30)));
}

function subtractBusyRanges(template: Map<number, boolean[]>, busy: Array<{ start: string; end: string }>) {
  for (const range of busy) {
    const start = new Date(range.start);
    const end = new Date(range.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) continue;

    const day = start.getUTCDay();
    const dayGrid = template.get(day);
    if (!dayGrid) continue;
    const startIndex = halfHourIndexFromDate(start);
    const endIndex = halfHourIndexFromDate(end);
    for (let i = startIndex; i < endIndex; i++) {
      dayGrid[i] = false;
    }
  }
}

function applyPersonalBlocks(template: Map<number, boolean[]>, blocks: Array<{ day: number; startHour: number; endHour: number }>) {
  for (const block of blocks) {
    const dayGrid = template.get(block.day);
    if (!dayGrid) continue;
    const startIndex = Math.max(0, Math.floor(block.startHour * 2));
    const endIndex = Math.min(48, Math.floor(block.endHour * 2));
    for (let i = startIndex; i < endIndex; i++) {
      dayGrid[i] = false;
    }
  }
}

function templateToSlots(template: Map<number, boolean[]>): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let day = 0; day < 7; day++) {
    const grid = template.get(day);
    if (!grid) continue;
    let startIndex: number | null = null;
    for (let i = 0; i < 48; i++) {
      if (grid[i] && startIndex === null) {
        startIndex = i;
      } else if (!grid[i] && startIndex !== null) {
        slots.push({ day, startHour: startIndex / 2, endHour: i / 2 });
        startIndex = null;
      }
    }
    if (startIndex !== null) {
      slots.push({ day, startHour: startIndex / 2, endHour: 24 });
    }
  }
  return slots;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const weeks = typeof body?.weeks === 'number' && body.weeks > 0 && body.weeks <= 12 ? body.weeks : 4;

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7);

  try {
    const [busy, blocks] = await Promise.all([
      fetchGoogleBusyTimes(session.user.id, start.toISOString(), end.toISOString()),
      prisma.userAvailabilityBlock.findMany({
        where: { userId: session.user.id },
        select: { day: true, startHour: true, endHour: true },
      }),
    ]);

    const template = buildFullDayTemplate();
    subtractBusyRanges(template, busy);
    applyPersonalBlocks(template, blocks);
    const slots = templateToSlots(template);

    await prisma.userAvailabilityDefault.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        slots: JSON.stringify(slots),
      },
      update: {
        slots: JSON.stringify(slots),
      },
    });

    return NextResponse.json({ success: true, slots });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 400 }
    );
  }
}
