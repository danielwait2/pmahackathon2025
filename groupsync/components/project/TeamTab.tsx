import { format } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface TeamMemberItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

interface TeamAgreementItem {
  responseTimeHours: number;
  meetingFrequency: string | null;
  communicationChannel: string | null;
  qualityStandards: string | null;
}

interface TeamTabProps {
  members: TeamMemberItem[];
  teamAgreement: TeamAgreementItem | null;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function TeamTab({ members, teamAgreement }: TeamTabProps) {
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

      <Card>
        <CardHeader>
          <CardTitle>Team Agreement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Response time: within {teamAgreement?.responseTimeHours ?? 24} hours</p>
          <p>Meeting frequency: {teamAgreement?.meetingFrequency ?? 'Not set'}</p>
          <p>Communication: {teamAgreement?.communicationChannel ?? 'Not set'}</p>
          <p>Quality standards: {teamAgreement?.qualityStandards ?? 'Not set'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
