import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { JoinProjectPageClient } from '@/components/dashboard/JoinProjectPageClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

function normalizeCode(rawCode: string) {
  return rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export default async function JoinByCodePage({ params }: JoinPageProps) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);
  const session = await getServerSession(authOptions);

  if (code.length !== 6) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Invalid invite code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">Invite codes must be 6 characters.</p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const project = await prisma.project.findUnique({
    where: { inviteCode: code },
    select: {
      id: true,
      name: true,
      description: true,
      createdBy: {
        select: { name: true },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Invalid invite code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">This invite code does not exist. Double-check with your team.</p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Join {project.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-600">
              <p>{project.description ?? 'Your teammate invited you to collaborate in GroupSync.'}</p>
              <p>
                {project._count.members} member{project._count.members === 1 ? '' : 's'} currently in this project.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/login?redirect=/join/${code}`}>Log in to join</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/signup?redirect=/join/${code}`}>Create account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const existingMembership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: session.user.id,
      },
    },
    select: { id: true },
  });

  if (existingMembership) {
    redirect(`/project/${project.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
        <JoinProjectPageClient
          code={code}
          projectId={project.id}
          projectName={project.name}
          projectDescription={project.description}
          creatorName={project.createdBy.name}
          memberCount={project._count.members}
        />
      </div>
    </main>
  );
}
