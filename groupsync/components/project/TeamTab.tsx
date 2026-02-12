'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamAgreement, type TeamAgreementData } from './TeamAgreement';
import { TeamAgreementEditor, type TeamAgreementFormData } from './TeamAgreementEditor';

export interface TeamMemberItem {
  id: string;
  assigneeId?: string | null;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

interface TeamTabProps {
  projectId: string;
  currentUserId: string;
  currentMemberId: string;
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

export function TeamTab({ projectId, currentUserId, currentMemberId, isOwner, members, teamAgreement, onRefresh }: TeamTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [membersList, setMembersList] = useState(members);

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project?`)) {
      return;
    }

    setDeletingId(memberId);
    try {
      const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMembersList(membersList.filter((m) => m.id !== memberId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch {
      alert('Failed to remove member');
    } finally {
      setDeletingId(null);
    }
  };

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

  const hasAgreed = teamAgreement?.agreedBy.includes(currentMemberId) ?? false;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {membersList.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-3 flex-1">
                <Avatar>
                  <AvatarImage src={member.avatarUrl ?? undefined} alt={member.name} />
                  <AvatarFallback>{initials(member.name || member.email || 'Guest')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{member.name}</p>
                  <p className="text-xs text-slate-500">Joined {format(new Date(member.joinedAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>{member.role}</Badge>
                {isOwner && member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    disabled={deletingId === member.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <TeamAgreement
        agreement={teamAgreement}
        members={membersList.map((m) => ({ id: m.id, name: m.name }))}
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
