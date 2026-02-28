import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeClassName } from '@/lib/class-utils';
import { parseIcsFeed } from '@/lib/calendar-import';

function detectProvider(url: string): 'learningsuite' | 'canvas' | 'other' {
  const lower = url.toLowerCase();
  if (lower.includes('learningsuite')) return 'learningsuite';
  if (lower.includes('instructure') || lower.includes('canvas')) return 'canvas';
  return 'other';
}

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 6);
}

async function createUniqueInviteCode() {
  let inviteCode = generateInviteCode();
  while (await prisma.project.findUnique({ where: { inviteCode }, select: { id: true } })) {
    inviteCode = generateInviteCode();
  }
  return inviteCode;
}

function isProjectLikeEvent(title: string, description: string) {
  const haystack = `${title} ${description}`.toLowerCase();
  const keywords = ['group project', 'group assignment', 'group work', 'team project', 'project'];
  return keywords.some((keyword) => haystack.includes(keyword));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const normalizedName = normalizeClassName(typeof body?.name === 'string' ? body.name : '');
  const calendarUrl = typeof body?.calendarUrl === 'string' ? body.calendarUrl.trim() : '';

  if (!normalizedName || !calendarUrl) {
    return NextResponse.json({ error: 'name and calendarUrl are required' }, { status: 400 });
  }

  const provider = detectProvider(calendarUrl);

  const cls = await prisma.class.upsert({
    where: { name: normalizedName },
    create: { name: normalizedName },
    update: {},
    select: { id: true, name: true },
  });

  await prisma.userClass.upsert({
    where: {
      userId_classId: {
        userId: session.user.id,
        classId: cls.id,
      },
    },
    create: {
      userId: session.user.id,
      classId: cls.id,
    },
    update: {},
  });

  await prisma.classCalendarFeed.upsert({
    where: {
      userId_classId_provider: {
        userId: session.user.id,
        classId: cls.id,
        provider,
      },
    },
    create: {
      userId: session.user.id,
      classId: cls.id,
      provider,
      url: calendarUrl,
    },
    update: {
      url: calendarUrl,
    },
  });

  const response = await fetch(calendarUrl, { cache: 'no-store' });
  if (!response.ok) {
    return NextResponse.json({ error: 'Unable to fetch calendar feed' }, { status: 400 });
  }

  const text = await response.text();
  const events = parseIcsFeed(text);

  let classProject = await prisma.project.findFirst({
    where: {
      createdById: session.user.id,
      classId: cls.id,
      sourceProvider: `calendar:${provider}:container`,
    },
    select: { id: true },
  });

  if (!classProject) {
    const inviteCode = await createUniqueInviteCode();
    classProject = await prisma.project.create({
      data: {
        name: `Class: ${cls.name}`,
        description: `Imported assignments for ${cls.name}`,
        classId: cls.id,
        classLabel: null,
        createdById: session.user.id,
        inviteCode,
        sourceProvider: `calendar:${provider}:container`,
        members: {
          create: {
            userId: session.user.id,
            role: 'owner',
          },
        },
        availability: {
          create: {
            userId: session.user.id,
            slots: '[]',
          },
        },
        teamAgreement: {
          create: {},
        },
      },
      select: { id: true },
    });
  }

  let createdProjects = 0;
  let createdAssignments = 0;

  for (const event of events) {
    const dueDate = event.end ?? event.start;
    if (isProjectLikeEvent(event.title, event.description)) {
      const existingProject = await prisma.project.findFirst({
        where: {
          createdById: session.user.id,
          classId: cls.id,
          sourceUid: event.uid,
          sourceProvider: provider,
        },
        select: { id: true },
      });

      if (existingProject) {
        await prisma.project.update({
          where: { id: existingProject.id },
          data: {
            name: event.title,
            description: event.description || null,
            deadline: dueDate,
          },
        });
      } else {
        const inviteCode = await createUniqueInviteCode();
        await prisma.project.create({
          data: {
            name: event.title,
            description: event.description || null,
            deadline: dueDate,
            classId: cls.id,
            classLabel: null,
            isAssignment: false,
            createdById: session.user.id,
            inviteCode,
            sourceUid: event.uid,
            sourceProvider: provider,
            members: {
              create: {
                userId: session.user.id,
                role: 'owner',
              },
            },
            availability: {
              create: {
                userId: session.user.id,
                slots: '[]',
              },
            },
            teamAgreement: {
              create: {},
            },
          },
        });
        createdProjects += 1;
      }
    } else {
      const existingTask = await prisma.task.findFirst({
        where: {
          projectId: classProject.id,
          sourceUid: event.uid,
          sourceProvider: provider,
          sourceClassId: cls.id,
        },
        select: { id: true },
      });

      if (existingTask) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            title: event.title,
            description: event.description || null,
            dueDate,
          },
        });
      } else {
        const currentMax = await prisma.task.aggregate({
          where: { projectId: classProject.id },
          _max: { orderIndex: true },
        });

        await prisma.task.create({
          data: {
            projectId: classProject.id,
            title: event.title,
            description: event.description || null,
            dueDate,
            status: 'todo',
            orderIndex: (currentMax._max.orderIndex ?? -1) + 1,
            sourceUid: event.uid,
            sourceProvider: provider,
            sourceClassId: cls.id,
          },
        });
        createdAssignments += 1;
      }
    }
  }

  return NextResponse.json({
    classId: cls.id,
    createdProjects,
    createdAssignments,
  });
}
