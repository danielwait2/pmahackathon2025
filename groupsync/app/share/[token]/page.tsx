import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GuestJoinForm } from '@/components/share/GuestJoinForm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    // Authenticated user trying to access share link
    // Redirect them to dashboard (they can join via invite code if needed)
    const project = await prisma.project.findUnique({
      where: { shareToken: token },
      select: { id: true }
    });

    if (project) {
      redirect(`/project/${project.id}`);
    }
  }

  const project = await prisma.project.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        where: { userId: null },
        select: { guestName: true },
        orderBy: { joinedAt: 'desc' }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const existingGuestNames = project.members
    .map(m => m.guestName)
    .filter((name): name is string => name !== null);

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GuestJoinForm
          token={token}
          projectName={project.name}
          projectDescription={project.description}
          existingGuestNames={existingGuestNames}
        />
      </div>
    </main>
  );
}
