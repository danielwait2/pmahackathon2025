import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateShareToken } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Retrieve existing share token (owner only)
export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true, shareToken: true, name: true }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.createdById !== session.user.id) {
    return NextResponse.json(
      { error: 'Only project owner can access share link' },
      { status: 403 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = project.shareToken ? `${baseUrl}/share/${project.shareToken}` : null;

  return NextResponse.json({
    shareToken: project.shareToken,
    shareUrl
  });
}

// POST - Generate new share token (owner only)
export async function POST(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.createdById !== session.user.id) {
    return NextResponse.json(
      { error: 'Only project owner can generate share link' },
      { status: 403 }
    );
  }

  // Generate unique token
  let shareToken = generateShareToken();
  // Ensure uniqueness (retry if collision)
  while (await prisma.project.findUnique({ where: { shareToken } })) {
    shareToken = generateShareToken();
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { shareToken }
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = `${baseUrl}/share/${shareToken}`;

  return NextResponse.json({
    shareToken,
    shareUrl
  });
}

// DELETE - Disable share link (owner only)
export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true }
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.createdById !== session.user.id) {
    return NextResponse.json(
      { error: 'Only project owner can disable share link' },
      { status: 403 }
    );
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { shareToken: null }
  });

  return NextResponse.json({ success: true });
}
