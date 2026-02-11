'use client';

import { useMemo } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { Copy, MoreVertical, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Project } from '@/types';

interface ProjectHeaderProps {
  project: Project;
  isOwner: boolean;
}

function getDeadlineState(deadline: string | null) {
  if (!deadline) {
    return { label: 'No deadline', className: 'bg-slate-100 text-slate-700' };
  }

  const daysLeft = differenceInCalendarDays(new Date(deadline), new Date());

  if (daysLeft < 0) {
    return { label: 'Overdue', className: 'bg-red-100 text-red-700' };
  }
  if (daysLeft < 3) {
    return { label: `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, className: 'bg-red-100 text-red-700' };
  }
  if (daysLeft <= 7) {
    return { label: `${daysLeft} days left`, className: 'bg-amber-100 text-amber-700' };
  }
  return { label: `${daysLeft} days left`, className: 'bg-emerald-100 text-emerald-700' };
}

export function ProjectHeader({ project, isOwner }: ProjectHeaderProps) {
  const deadline = useMemo(() => getDeadlineState(project.deadline), [project.deadline]);
  const inviteUrl = typeof window === 'undefined' ? `/join/${project.invite_code}` : `${window.location.origin}/join/${project.invite_code}`;

  const copyText = async (value: string, successMessage: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  };

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={deadline.className}>{deadline.label}</Badge>
            <span className="text-sm text-slate-500">
              {project.deadline ? `Due ${format(new Date(project.deadline), 'MMM d, yyyy')}` : 'No due date set'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Share2 className="h-4 w-4" />
                Invite
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-3" align="end">
              <div>
                <p className="text-sm font-semibold text-slate-900">Invite teammates</p>
                <p className="text-xs text-slate-500">Share this code or link.</p>
              </div>
              <div className="rounded-md border bg-slate-50 p-3 text-center font-mono text-xl font-bold tracking-[0.25em] text-slate-900">
                {project.invite_code}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => copyText(project.invite_code, 'Invite code copied!')}>
                  <Copy className="h-4 w-4" />
                  Copy code
                </Button>
                <Button type="button" size="sm" onClick={() => copyText(inviteUrl, 'Invite link copied!')}>
                  Copy link
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Project settings">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Project Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Edit project</DropdownMenuItem>
                <DropdownMenuItem disabled className="text-red-600 focus:text-red-600">
                  Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {project.description && <p className="mt-4 text-sm text-slate-600">{project.description}</p>}
    </header>
  );
}
