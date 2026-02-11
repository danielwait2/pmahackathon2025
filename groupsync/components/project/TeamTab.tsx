'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Copy, Link2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase';
import { ProjectMember, TeamAgreement as TeamAgreementType } from '@/types';

import { TeamAgreement } from '@/components/project/TeamAgreement';
import { TeamAgreementEditor } from '@/components/project/TeamAgreementEditor';

interface TeamTabProps {
  projectId: string;
  inviteCode: string;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  initialAgreement: TeamAgreementType | null;
  currentUserId: string;
  isOwner: boolean;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TeamTab({
  projectId,
  inviteCode,
  members,
  initialAgreement,
  currentUserId,
  isOwner,
}: TeamTabProps) {
  const [agreement, setAgreement] = useState<TeamAgreementType | null>(initialAgreement);
  const [editorOpen, setEditorOpen] = useState(false);
  const [agreeing, setAgreeing] = useState(false);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        if (a.role !== b.role) return a.role === 'owner' ? -1 : 1;
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      }),
    [members]
  );

  const handleAgreementSaved = (nextAgreement: TeamAgreementType) => {
    setAgreement(nextAgreement);
  };

  const handleAgree = async () => {
    if (!agreement) return;
    if (agreement.agreed_by.includes(currentUserId)) return;

    const optimistic = [...agreement.agreed_by, currentUserId];
    setAgreement({ ...agreement, agreed_by: optimistic });
    setAgreeing(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('team_agreements')
        .update({ agreed_by: optimistic, updated_at: new Date().toISOString() })
        .eq('id', agreement.id)
        .select('*')
        .single();

      if (error || !data) {
        setAgreement(agreement);
        toast.error(error?.message ?? 'Unable to save your response.');
        return;
      }

      setAgreement(data as TeamAgreementType);
      toast.success("Thanks! You've agreed to the team expectations.");
    } catch {
      setAgreement(agreement);
      toast.error('Unable to save your response right now.');
    } finally {
      setAgreeing(false);
    }
  };

  const copyInviteLink = async () => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Invite link copied to clipboard!');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.profile.avatar_url ?? undefined} alt={member.profile.name} />
                  <AvatarFallback>{getInitials(member.profile.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{member.profile.name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role === 'owner' ? 'Owner' : 'Member'}
                    </Badge>
                    <p className="text-xs text-slate-500">
                      Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-500">{format(new Date(member.joined_at), 'MMM d')}</span>
            </div>
          ))}

          <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">Invite more teammates</p>
            <Button className="mt-2" variant="outline" onClick={copyInviteLink}>
              <Link2 className="h-4 w-4" />
              <Copy className="h-4 w-4" />
              Copy Invite Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <TeamAgreement
        agreement={agreement}
        members={sortedMembers}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onCreateOrEdit={() => setEditorOpen(true)}
        onAgree={handleAgree}
        agreeing={agreeing}
      />

      <TeamAgreementEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        projectId={projectId}
        agreement={agreement}
        isOwner={isOwner}
        currentUserId={currentUserId}
        onSaved={handleAgreementSaved}
      />
    </div>
  );
}
