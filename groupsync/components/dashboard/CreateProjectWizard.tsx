'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase';

interface CreateProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedProject {
  id: string;
  name: string;
  invite_code: string;
}

const responseTimeMap: Record<string, number> = {
  'Within 1 hour': 1,
  'Within 4 hours': 4,
  'Within 24 hours': 24,
  'Within 48 hours': 48,
};

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={cn('h-2.5 w-2.5 rounded-full', step === dot ? 'bg-blue-600' : 'bg-slate-300')}
        />
      ))}
    </div>
  );
}

export function CreateProjectWizard({ open, onOpenChange }: CreateProjectWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  const [responseTime, setResponseTime] = useState('Within 24 hours');
  const [meetingFrequency, setMeetingFrequency] = useState('Weekly');
  const [communicationChannel, setCommunicationChannel] = useState('Discord');
  const [customChannel, setCustomChannel] = useState('');

  const deadlineValid = useMemo(() => {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deadline > today;
  }, [deadline]);

  const stepOneValid = name.trim().length > 0 && name.trim().length <= 100 && deadlineValid;

  const resetWizard = () => {
    setStep(1);
    setLoading(false);
    setCreatedProject(null);
    setName('');
    setDescription('');
    setDeadline(undefined);
    setResponseTime('Within 24 hours');
    setMeetingFrequency('Weekly');
    setCommunicationChannel('Discord');
    setCustomChannel('');
  };

  const closeWizard = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetWizard();
    }
  };

  const handleCreateProject = async () => {
    if (!stepOneValid || !deadline) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please log in to create a project.');
        router.push('/login');
        return;
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          deadline: deadline.toISOString().slice(0, 10),
          created_by: user.id,
        })
        .select('id, name, invite_code')
        .single();

      if (projectError || !project) {
        toast.error(projectError?.message ?? 'Unable to create project.');
        return;
      }

      const { error: memberError } = await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) {
        toast.error(memberError.message);
        return;
      }

      const { error: agreementError } = await supabase.from('team_agreements').insert({
        project_id: project.id,
        response_time_hours: responseTimeMap[responseTime] ?? 24,
        meeting_frequency: meetingFrequency,
        communication_channel: communicationChannel === 'Other' ? customChannel.trim() || 'Other' : communicationChannel,
      });

      if (agreementError) {
        toast.error(agreementError.message);
        return;
      }

      setCreatedProject(project);
      setStep(2);
      toast.success('Project created. Set team expectations next.');
    } catch {
      toast.error('Unable to create project right now.');
    } finally {
      setLoading(false);
    }
  };

  const saveTeamAgreement = async () => {
    if (!createdProject) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const channel = communicationChannel === 'Other' ? customChannel.trim() || 'Other' : communicationChannel;
      const { error } = await supabase.from('team_agreements').upsert({
        project_id: createdProject.id,
        response_time_hours: responseTimeMap[responseTime] ?? 24,
        meeting_frequency: meetingFrequency,
        communication_channel: channel,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setStep(3);
      toast.success('Team setup saved.');
    } catch {
      toast.error('Unable to save team settings.');
    } finally {
      setLoading(false);
    }
  };

  const skipStepTwo = () => {
    setStep(3);
  };

  const copyInviteLink = async () => {
    if (!createdProject) return;
    const inviteUrl = `${window.location.origin}/join/${createdProject.invite_code}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Link copied!');
  };

  const copyInviteCode = async () => {
    if (!createdProject) return;
    await navigator.clipboard.writeText(createdProject.invite_code);
    toast.success('Code copied!');
  };

  const done = () => {
    if (!createdProject) return;
    closeWizard(false);
    router.push(`/project/${createdProject.id}`);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={closeWizard}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>Step {step} of 3</DialogDescription>
        </DialogHeader>
        <StepIndicator step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 100))}
                placeholder="CS Capstone Final Project"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="What are you building and for which class?"
              />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !deadline && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP') : 'Pick a deadline'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus />
                </PopoverContent>
              </Popover>
              {!deadlineValid && deadline && (
                <p className="text-sm text-red-600">Deadline must be in the future.</p>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreateProject} disabled={!stepOneValid || loading}>
                {loading ? 'Creating...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Response time expectation</Label>
              <Select value={responseTime} onValueChange={setResponseTime}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Within 1 hour">Within 1 hour</SelectItem>
                  <SelectItem value="Within 4 hours">Within 4 hours</SelectItem>
                  <SelectItem value="Within 24 hours">Within 24 hours</SelectItem>
                  <SelectItem value="Within 48 hours">Within 48 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meeting frequency</Label>
              <Select value={meetingFrequency} onValueChange={setMeetingFrequency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Twice a week">Twice a week</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="As needed">As needed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred communication</Label>
              <Select value={communicationChannel} onValueChange={setCommunicationChannel}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iMessage">iMessage</SelectItem>
                  <SelectItem value="Discord">Discord</SelectItem>
                  <SelectItem value="Slack">Slack</SelectItem>
                  <SelectItem value="GroupMe">GroupMe</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
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
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={skipStepTwo} disabled={loading}>
                Skip
              </Button>
              <Button onClick={saveTeamAgreement} disabled={loading}>
                {loading ? 'Saving...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && createdProject && (
          <div className="space-y-5">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-center">
              <p className="text-sm font-medium text-blue-700">Invite code</p>
              <p className="mt-2 font-mono text-4xl font-black tracking-[0.35em] text-blue-800">
                {createdProject.invite_code}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Invite link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdProject.invite_code}`}
                />
                <Button type="button" variant="outline" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={copyInviteCode}>
                Copy Code
              </Button>
              <Button type="button" onClick={done}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Done - Go to Project
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
