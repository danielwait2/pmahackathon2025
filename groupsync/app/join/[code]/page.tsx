import Link from 'next/link';

import { JoinProjectPageClient } from '@/components/dashboard/JoinProjectPageClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerSupabaseClient } from '@/lib/supabase';

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinByCodePage({ params }: JoinPageProps) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, description, created_by, invite_code')
    .eq('invite_code', code)
    .maybeSingle();

  if (!project) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Invalid invite code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">This invite code doesn&apos;t exist. Double-check with your team.</p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const [{ data: creator }, { data: members }] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', project.created_by).maybeSingle(),
    supabase.from('project_members').select('id').eq('project_id', project.id),
  ]);

  let existingMembership: { id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', user.id)
      .maybeSingle();
    existingMembership = data;
  }

  return (
    <JoinProjectPageClient
      code={code}
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
      creatorName={creator?.name ?? null}
      memberCount={members?.length ?? 0}
      isAuthenticated={Boolean(user)}
      isAlreadyMember={Boolean(existingMembership)}
    />
  );
}
