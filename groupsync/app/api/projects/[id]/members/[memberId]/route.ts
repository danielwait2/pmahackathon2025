import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/auth-helpers';

interface RouteProps {
  params: Promise<{ id: string; memberId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { id: projectId, memberId } = await params;

  // Get current user's project membership
  const projectMember = await getProjectMember(projectId);
  if (!projectMember) {
    return NextResponse.json({ error: 'Not a project member' }, { status: 403 });
  }

  // Fetch project to check ownership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdById: true },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Only project owner can delete members
  const isOwner = project.createdById === projectMember.userId;
  if (!isOwner) {
    return NextResponse.json(
      { error: 'Only project owner can remove members' },
      { status: 403 }
    );
  }

  // Fetch the member to be deleted
  const memberToDelete = await prisma.projectMember.findUnique({
    where: { id: memberId },
    select: { id: true, projectId: true, userId: true, role: true },
  });

  if (!memberToDelete) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // Verify member belongs to this project
  if (memberToDelete.projectId !== projectId) {
    return NextResponse.json(
      { error: 'Member does not belong to this project' },
      { status: 400 }
    );
  }

  // Prevent owner from removing themselves
  if (memberToDelete.userId === projectMember.userId) {
    return NextResponse.json(
      { error: 'Cannot remove yourself from the project' },
      { status: 400 }
    );
  }

  // Prevent removing other owners
  if (memberToDelete.role === 'owner') {
    return NextResponse.json(
      { error: 'Cannot remove project owner' },
      { status: 400 }
    );
  }

  // Delete the member (cascades to availability per schema)
  await prisma.projectMember.delete({
    where: { id: memberId },
  });

  return NextResponse.json({ deleted: true });
}
