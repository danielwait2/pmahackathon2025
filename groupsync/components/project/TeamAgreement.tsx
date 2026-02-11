'use client';

import { CalendarDays, CheckCircle2, Circle, Clock3, MessageSquare, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamAgreement as TeamAgreementType, ProjectMember } from '@/types';

interface TeamAgreementProps {
  agreement: TeamAgreementType | null;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  currentUserId: string;
  isOwner: boolean;
  onCreateOrEdit: () => void;
  onAgree: () => Promise<void>;
  agreeing: boolean;
}

function responseTimeLabel(hours: number | null | undefined) {
  if (!hours) return 'Respond within 24 hours';
  return `Respond within ${hours} hour${hours === 1 ? '' : 's'}`;
}

function meetingLabel(value: string | null | undefined) {
  if (!value) return 'Meet weekly';
  if (value === 'As needed') return 'Meet as needed';
  return `Meet ${value.toLowerCase()}`;
}

function communicationLabel(value: string | null | undefined) {
  if (!value) return 'Communicate via Discord';
  return `Communicate via ${value}`;
}

export function TeamAgreement({
  agreement,
  members,
  currentUserId,
  isOwner,
  onCreateOrEdit,
  onAgree,
  agreeing,
}: TeamAgreementProps) {
  if (!agreement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOwner ? (
            <>
              <p className="text-sm text-slate-600">Set expectations for your team.</p>
              <Button onClick={onCreateOrEdit}>Create Agreement</Button>
            </>
          ) : (
            <p className="text-sm text-slate-600">Your team lead hasn&apos;t set expectations yet.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  const memberIds = new Set(members.map((member) => member.user_id));
  const agreedIds = new Set(agreement.agreed_by.filter((id) => memberIds.has(id)));
  const agreedCount = agreedIds.size;
  const totalMembers = members.length;
  const allAligned = totalMembers > 0 && agreedCount === totalMembers;
  const progress = totalMembers === 0 ? 0 : Math.round((agreedCount / totalMembers) * 100);
  const currentUserAgreed = agreedIds.has(currentUserId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Team Agreement</CardTitle>
        <Badge
          className={allAligned ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
          variant={allAligned ? 'secondary' : 'outline'}
        >
          {allAligned ? 'Team Aligned' : `${agreedCount} of ${totalMembers} Aligned`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>{responseTimeLabel(agreement.response_time_hours)}</p>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>{meetingLabel(agreement.meeting_frequency)}</p>
          </div>
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>{communicationLabel(agreement.communication_channel)}</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-slate-500" />
            <p>{agreement.quality_standards?.trim() || 'No additional quality standards set.'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Alignment progress</span>
            <span>{agreedCount} / {totalMembers}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="space-y-2">
          {members.map((member) => {
            const memberAgreed = agreedIds.has(member.user_id);
            return (
              <div key={member.id} className="flex items-center justify-between rounded-md border border-slate-200 p-2 text-sm">
                <span className="text-slate-900">{member.profile.name}</span>
                <span className={`inline-flex items-center gap-1 ${memberAgreed ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {memberAgreed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  {memberAgreed ? 'Agreed' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOwner && (
            <Button variant="outline" onClick={onCreateOrEdit}>
              <Pencil className="h-4 w-4" />
              Edit Agreement
            </Button>
          )}
          {!isOwner && !currentUserAgreed && (
            <Button onClick={onAgree} disabled={agreeing}>
              {agreeing ? 'Saving...' : 'I Agree to These Expectations'}
            </Button>
          )}
          {!isOwner && currentUserAgreed && (
            <Button variant="outline" disabled>
              <CheckCircle2 className="h-4 w-4" />
              You&apos;ve agreed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
