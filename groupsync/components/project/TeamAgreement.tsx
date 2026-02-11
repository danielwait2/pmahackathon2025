'use client';

import { useState } from 'react';
import { CheckCircle2, Edit, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export interface TeamAgreementData {
  id: string;
  responseTimeHours: number;
  meetingFrequency: string | null;
  communicationChannel: string | null;
  qualityStandards: string | null;
  agreedBy: string[]; // Array of user IDs who have agreed
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
}

interface TeamAgreementProps {
  agreement: TeamAgreementData | null;
  members: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
  hasAgreed: boolean;
  onEdit?: () => void;
  onAgree?: () => Promise<void>;
}

export function TeamAgreement({
  agreement,
  members,
  currentUserId,
  isOwner,
  hasAgreed,
  onEdit,
  onAgree,
}: TeamAgreementProps) {
  const [isAgreeing, setIsAgreeing] = useState(false);

  const handleAgree = async () => {
    if (!onAgree) return;
    setIsAgreeing(true);
    try {
      await onAgree();
    } catch (error) {
      console.error('Failed to agree:', error);
    } finally {
      setIsAgreeing(false);
    }
  };

  if (!agreement) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team Agreement</CardTitle>
            {isOwner && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Create Agreement
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-sm text-slate-600">
            No team agreement has been set yet.
          </p>
          {isOwner && (
            <p className="text-xs text-slate-500 mt-2">
              As the project owner, you can create a team agreement to set expectations.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const agreedCount = agreement.agreedBy.length;
  const totalMembers = members.length;
  const agreedMembers = members.filter((m) => agreement.agreedBy.includes(m.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Agreement</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {agreedCount} of {totalMembers} members have agreed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasAgreed && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                You agreed
              </Badge>
            )}
            {isOwner && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agreement Details */}
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-slate-700">Response Time</span>
              <span className="text-sm text-slate-900">Within {agreement.responseTimeHours} hours</span>
            </div>
            <Separator />
            {agreement.meetingFrequency && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-700">Meeting Frequency</span>
                  <span className="text-sm text-slate-900">{agreement.meetingFrequency}</span>
                </div>
                <Separator />
              </>
            )}
            {agreement.communicationChannel && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-slate-700">Communication Channel</span>
                  <span className="text-sm text-slate-900">{agreement.communicationChannel}</span>
                </div>
                <Separator />
              </>
            )}
            {agreement.qualityStandards && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">Quality Standards</span>
                <span className="text-sm text-slate-600 whitespace-pre-wrap">
                  {agreement.qualityStandards}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Agreement Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Who has agreed</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {agreedMembers.map((member) => (
              <Badge key={member.id} variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {member.name}
              </Badge>
            ))}
            {agreedCount === 0 && (
              <p className="text-sm text-slate-500">No one has agreed yet</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!hasAgreed && onAgree && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Please review and agree to this team agreement
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  By agreeing, you commit to following these team expectations
                </p>
              </div>
              <Button onClick={handleAgree} disabled={isAgreeing}>
                {isAgreeing ? 'Agreeing...' : 'I Agree'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
