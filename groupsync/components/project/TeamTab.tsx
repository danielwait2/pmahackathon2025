'use client';

import { useState } from 'react';
import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamAgreement, type TeamAgreementData } from './TeamAgreement';
import { TeamAgreementEditor, type TeamAgreementFormData } from './TeamAgreementEditor';

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

interface TeamTabProps {
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
  members: TeamMemberItem[];
  teamAgreement: TeamAgreementData | null;
  onRefresh: () => void;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TeamTab({ projectId, currentUserId, isOwner, members, teamAgreement, onRefresh }: TeamTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = async (data: TeamAgreementFormData) => {
    const response = await fetch(`/api/team-agreement/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save team agreement');
    }

    onRefresh();
    setIsEditing(false);
  };

  const handleAgree = async () => {
    const response = await fetch(`/api/team-agreement/${projectId}/agree`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Failed to agree to team agreement');
    }

    onRefresh();
  };

  const hasAgreed = teamAgreement?.agreedBy.includes(currentUserId) ?? false;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                  <AvatarFallback>{initials(member.name || member.email)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <TeamAgreement
        agreement={teamAgreement}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        currentUserId={currentUserId}
        isOwner={isOwner}
        hasAgreed={hasAgreed}
        onEdit={() => setIsEditing(true)}
        onAgree={handleAgree}
      />

      {isEditing && (
        <TeamAgreementEditor
          open={isEditing}
          onClose={() => setIsEditing(false)}
          initialData={
            teamAgreement
              ? {
                  responseTimeHours: teamAgreement.responseTimeHours,
                  meetingFrequency: teamAgreement.meetingFrequency ?? '',
                  communicationChannel: teamAgreement.communicationChannel ?? '',
                  qualityStandards: teamAgreement.qualityStandards ?? '',
                }
              : undefined
          }
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
