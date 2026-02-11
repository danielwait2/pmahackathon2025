'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase';
import { TeamAgreement } from '@/types';

interface TeamAgreementEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  agreement: TeamAgreement | null;
  isOwner: boolean;
  currentUserId: string;
  onSaved: (agreement: TeamAgreement, mode: 'create' | 'update') => void;
}

const RESPONSE_TIME_OPTIONS = [
  { label: 'Within 1 hour', hours: 1 },
  { label: 'Within 4 hours', hours: 4 },
  { label: 'Within 24 hours', hours: 24 },
  { label: 'Within 48 hours', hours: 48 },
];

const MEETING_FREQUENCY_OPTIONS = ['Daily', 'Twice a week', 'Weekly', 'As needed'] as const;
const CHANNEL_OPTIONS = ['iMessage', 'Discord', 'Slack', 'GroupMe', 'Other'] as const;

function responseLabelFromHours(hours: number | null | undefined) {
  const option = RESPONSE_TIME_OPTIONS.find((entry) => entry.hours === hours);
  return option?.label ?? 'Within 24 hours';
}

function responseHoursFromLabel(label: string) {
  return RESPONSE_TIME_OPTIONS.find((entry) => entry.label === label)?.hours ?? 24;
}

export function TeamAgreementEditor({
  open,
  onOpenChange,
  projectId,
  agreement,
  isOwner,
  currentUserId,
  onSaved,
}: TeamAgreementEditorProps) {
  const [saving, setSaving] = useState(false);
  const [responseTime, setResponseTime] = useState('Within 24 hours');
  const [meetingFrequency, setMeetingFrequency] = useState('Weekly');
  const [communicationChannel, setCommunicationChannel] = useState('Discord');
  const [customChannel, setCustomChannel] = useState('');
  const [qualityStandards, setQualityStandards] = useState('');

  const isEdit = Boolean(agreement);

  useEffect(() => {
    if (!open) return;

    setResponseTime(responseLabelFromHours(agreement?.response_time_hours));
    setMeetingFrequency(agreement?.meeting_frequency ?? 'Weekly');

    const currentChannel = agreement?.communication_channel ?? 'Discord';
    if (CHANNEL_OPTIONS.includes(currentChannel as (typeof CHANNEL_OPTIONS)[number])) {
      setCommunicationChannel(currentChannel);
      setCustomChannel('');
    } else {
      setCommunicationChannel('Other');
      setCustomChannel(currentChannel);
    }

    setQualityStandards(agreement?.quality_standards ?? '');
  }, [agreement, open]);

  const selectedChannel = useMemo(
    () => (communicationChannel === 'Other' ? customChannel.trim() || 'Other' : communicationChannel),
    [communicationChannel, customChannel]
  );

  const saveAgreement = async () => {
    if (!isOwner) return;
    if (communicationChannel === 'Other' && !customChannel.trim()) {
      toast.error('Enter a communication channel.');
      return;
    }

    if (isEdit) {
      const confirmed = window.confirm(
        'Saving changes will require all team members to re-agree. Continue?'
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('team_agreements')
        .upsert(
          {
            project_id: projectId,
            response_time_hours: responseHoursFromLabel(responseTime),
            meeting_frequency: meetingFrequency,
            communication_channel: selectedChannel,
            quality_standards: qualityStandards.trim() || null,
            agreed_by: [currentUserId],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        )
        .select('*')
        .single();

      if (error || !data) {
        toast.error(error?.message ?? 'Unable to save agreement.');
        return;
      }

      onSaved(data as TeamAgreement, isEdit ? 'update' : 'create');
      toast.success(isEdit ? 'Agreement updated. Team needs to re-agree.' : 'Team agreement created!');
      onOpenChange(false);
    } catch {
      toast.error('Unable to save agreement right now.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team Agreement' : 'Create Team Agreement'}</DialogTitle>
          <DialogDescription>Set expectations so your team can stay aligned.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Response Time</Label>
            <Select value={responseTime} onValueChange={setResponseTime}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_TIME_OPTIONS.map((option) => (
                  <SelectItem key={option.label} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meeting Frequency</Label>
            <Select value={meetingFrequency} onValueChange={setMeetingFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_FREQUENCY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Communication Channel</Label>
            <Select value={communicationChannel} onValueChange={setCommunicationChannel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {communicationChannel === 'Other' && (
              <Input
                value={customChannel}
                onChange={(event) => setCustomChannel(event.target.value)}
                placeholder="Enter custom channel"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quality-standards">Quality Standards (optional)</Label>
            <Textarea
              id="quality-standards"
              value={qualityStandards}
              onChange={(event) => setQualityStandards(event.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="e.g., Review each other's work before submitting, cite all sources, proofread for grammar..."
            />
            <p className="text-right text-xs text-slate-500">{qualityStandards.length}/500</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={saveAgreement} disabled={saving}>
            {saving ? 'Saving...' : 'Save Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
