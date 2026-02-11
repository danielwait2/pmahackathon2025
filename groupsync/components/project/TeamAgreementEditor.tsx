'use client';

import { useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';

export interface TeamAgreementFormData {
  responseTimeHours: number;
  meetingFrequency: string;
  communicationChannel: string;
  qualityStandards: string;
}

interface TeamAgreementEditorProps {
  open: boolean;
  onClose: () => void;
  initialData?: Partial<TeamAgreementFormData>;
  onSubmit: (data: TeamAgreementFormData) => Promise<void>;
}

export function TeamAgreementEditor({
  open,
  onClose,
  initialData,
  onSubmit,
}: TeamAgreementEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TeamAgreementFormData>({
    responseTimeHours: initialData?.responseTimeHours || 24,
    meetingFrequency: initialData?.meetingFrequency || '',
    communicationChannel: initialData?.communicationChannel || '',
    qualityStandards: initialData?.qualityStandards || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save team agreement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {initialData ? 'Edit Team Agreement' : 'Create Team Agreement'}
            </DialogTitle>
            <DialogDescription>
              Set expectations for how your team will work together. Members will be asked to
              acknowledge these terms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Response Time */}
            <div className="space-y-2">
              <Label htmlFor="responseTimeHours">
                Response Time (hours) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="responseTimeHours"
                type="number"
                min="1"
                max="168"
                value={formData.responseTimeHours}
                onChange={(e) =>
                  setFormData({ ...formData, responseTimeHours: parseInt(e.target.value) || 24 })
                }
                placeholder="24"
                required
              />
              <p className="text-xs text-slate-500">
                How quickly should team members respond to messages? (1-168 hours)
              </p>
            </div>

            {/* Meeting Frequency */}
            <div className="space-y-2">
              <Label htmlFor="meetingFrequency">Meeting Frequency</Label>
              <Input
                id="meetingFrequency"
                value={formData.meetingFrequency}
                onChange={(e) => setFormData({ ...formData, meetingFrequency: e.target.value })}
                placeholder="e.g., Weekly, Bi-weekly, Daily standups"
              />
              <p className="text-xs text-slate-500">
                How often should the team meet? (optional)
              </p>
            </div>

            {/* Communication Channel */}
            <div className="space-y-2">
              <Label htmlFor="communicationChannel">Communication Channel</Label>
              <Input
                id="communicationChannel"
                value={formData.communicationChannel}
                onChange={(e) =>
                  setFormData({ ...formData, communicationChannel: e.target.value })
                }
                placeholder="e.g., Slack, Discord, Email, Teams"
              />
              <p className="text-xs text-slate-500">
                Where should team communication happen? (optional)
              </p>
            </div>

            {/* Quality Standards */}
            <div className="space-y-2">
              <Label htmlFor="qualityStandards">Quality Standards</Label>
              <Textarea
                id="qualityStandards"
                value={formData.qualityStandards}
                onChange={(e) => setFormData({ ...formData, qualityStandards: e.target.value })}
                placeholder="e.g., Code must be reviewed before merging, All commits must have clear messages, Test coverage above 80%"
                rows={4}
              />
              <p className="text-xs text-slate-500">
                What quality standards should the team follow? (optional)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : initialData
                ? 'Update Agreement'
                : 'Create Agreement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
