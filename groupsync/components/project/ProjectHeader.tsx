'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, BookOpen, CalendarClock, Check, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatClassNameForDisplay } from '@/lib/class-utils';
import { ShareLinkManager } from './ShareLinkManager';

interface ProjectHeaderProps {
  name: string;
  description: string | null;
  deadline: string | null;
  className: string | null;
  isAssignment?: boolean;
  inviteCode: string;
  memberCount: number;
  shareToken?: string | null;
  isOwner?: boolean;
  projectId?: string;
  archivedAt?: string | null;
}

export function ProjectHeader({
  name,
  description,
  deadline,
  className,
  isAssignment,
  inviteCode,
  memberCount,
  shareToken,
  isOwner,
  projectId,
  archivedAt,
}: ProjectHeaderProps) {
  const router = useRouter();
  const [copying, setCopying] = useState(false);
  const [updatingArchive, setUpdatingArchive] = useState(false);
  const isArchived = !!archivedAt;

  const copyCode = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Invite code copied.');
    } catch {
      toast.error('Unable to copy invite code.');
    } finally {
      setCopying(false);
    }
  };

  const handleArchiveToggle = async (nextArchived: boolean) => {
    if (!projectId || updatingArchive) return;
    setUpdatingArchive(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: nextArchived }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Unable to update project status.');
        return;
      }
      toast.success(nextArchived ? 'Project marked completed.' : 'Project moved back to active.');
      router.refresh();
    } catch {
      toast.error('Unable to update project status.');
    } finally {
      setUpdatingArchive(false);
    }
  };

  return (
    <header className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Navigation */}
      <div className="pb-3 border-b border-slate-100">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
            {isAssignment && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                Assignment
              </Badge>
            )}
            {isArchived && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                Completed
              </Badge>
            )}
          </div>
          {description ? <p className="max-w-3xl text-slate-600">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700">Invite: {inviteCode}</Badge>
          <Button variant="outline" size="sm" onClick={copyCode} disabled={copying}>
            <Copy className="h-4 w-4" />
            {copying ? 'Copying...' : 'Copy'}
          </Button>
          {isOwner && projectId && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={updatingArchive}
              onClick={() => void handleArchiveToggle(!isArchived)}
            >
              <span
                className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                  isArchived ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-white text-white'
                }`}
              >
                <Check className="h-3 w-3" />
              </span>
              {updatingArchive ? 'Saving...' : isArchived ? 'Completed' : 'Mark completed'}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {memberCount} member{memberCount === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="h-4 w-4" />
          {deadline ? format(new Date(deadline), 'MMMM d, yyyy') : 'No deadline set'}
        </span>
        {className ? (
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            {formatClassNameForDisplay(className)}
          </span>
        ) : null}
      </div>

      {isOwner && projectId && (
        <div className="pt-4 border-t border-slate-100">
          <ShareLinkManager projectId={projectId} initialShareToken={shareToken || null} />
        </div>
      )}
    </header>
  );
}
