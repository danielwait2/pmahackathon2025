'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarClock, Copy, Users, ArrowLeft, Home } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProjectHeaderProps {
  name: string;
  description: string | null;
  deadline: string | null;
  inviteCode: string;
  memberCount: number;
}

export function ProjectHeader({ name, description, deadline, inviteCode, memberCount }: ProjectHeaderProps) {
  const [copying, setCopying] = useState(false);

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

  return (
    <header className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <Link href="/projects">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            All Projects
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{name}</h1>
          {description ? <p className="max-w-3xl text-slate-600">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700">Invite: {inviteCode}</Badge>
          <Button variant="outline" size="sm" onClick={copyCode} disabled={copying}>
            <Copy className="h-4 w-4" />
            {copying ? 'Copying...' : 'Copy'}
          </Button>
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
      </div>
    </header>
  );
}
