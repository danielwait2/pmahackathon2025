import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface ProjectMemberAuth {
  userId: string | null;
  memberId: string;
  memberName: string;
  isGuest: boolean;
  role: string;
}

/**
 * Get the current project member from either NextAuth session or guest cookie.
 * Checks authenticated session first, then falls back to guest cookie.
 *
 * @param projectId - The project ID to check membership for
 * @returns Project member auth info or null if not authenticated
 */
export async function getProjectMember(
  projectId: string
): Promise<ProjectMemberAuth | null> {
  // Check authenticated session first
  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id }
      },
      select: {
        id: true,
        role: true,
        user: { select: { name: true } }
      }
    });

    if (member) {
      return {
        userId: session.user.id,
        memberId: member.id,
        memberName: member.user?.name || 'User',
        isGuest: false,
        role: member.role
      };
    }
  }

  // Check guest cookie
  const cookieStore = await cookies();
  const guestMemberId = cookieStore.get(`guest_member_${projectId}`)?.value;

  if (guestMemberId) {
    const member = await prisma.projectMember.findFirst({
      where: {
        id: guestMemberId,
        projectId,
        userId: null
      },
      select: { id: true, role: true, guestName: true }
    });

    if (member && member.guestName) {
      return {
        userId: null,
        memberId: member.id,
        memberName: member.guestName,
        isGuest: true,
        role: member.role
      };
    }
  }

  return null;
}

/**
 * Generate a unique shareable token for a project.
 * Uses 16 random bytes encoded as base64url (URL-safe).
 *
 * @returns A unique shareable token string
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString('base64url');
}

/**
 * Set a guest member cookie for a specific project.
 * Cookie is httpOnly, secure in production, and lasts 30 days.
 *
 * @param projectId - The project ID
 * @param memberId - The project member ID
 */
export async function setGuestMemberCookie(projectId: string, memberId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`guest_member_${projectId}`, memberId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });
}

/**
 * Get the guest member cookie value for a specific project.
 *
 * @param projectId - The project ID
 * @returns The member ID from the cookie or undefined
 */
export async function getGuestMemberCookie(projectId: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(`guest_member_${projectId}`)?.value;
}

/**
 * Clear the guest member cookie for a specific project.
 *
 * @param projectId - The project ID
 */
export async function clearGuestMemberCookie(projectId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`guest_member_${projectId}`);
}
