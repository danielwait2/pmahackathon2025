'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { differenceInCalendarDays, format } from 'date-fns';
import { BookOpen, CalendarClock, CheckCircle2, Users } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatClassNameForDisplay } from '@/lib/class-utils';
import { DashboardProject } from '@/types';

interface ProjectCardProps {
  project: DashboardProject;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
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

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  const progressPercent = useMemo(() => {
    if (!project.total_tasks) return 0;
    return Math.round((project.completed_tasks / project.total_tasks) * 100);
  }, [project.total_tasks, project.completed_tasks]);

  const deadline = getDeadlineState(project.deadline);
  const shownMembers = project.members.slice(0, 3);
  const overflow = Math.max(project.member_count - shownMembers.length, 0);

  return (
    <Card
      className="cursor-pointer border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      onClick={() => router.push(`/project/${project.id}`)}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-1 text-base sm:text-lg">{project.name}</CardTitle>
          <Badge className={deadline.className}>{deadline.label}</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock className="h-3.5 w-3.5" />
          <span>{project.deadline ? format(new Date(project.deadline), 'MMM d, yyyy') : 'No due date set'}</span>
        </div>
        {project.className ? (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{formatClassNameForDisplay(project.className)}</span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="h-4 w-4" />
            <span>{project.member_count} member{project.member_count === 1 ? '' : 's'}</span>
          </div>
          <AvatarGroup>
            {shownMembers.map((member) => (
              <Avatar key={member.id} size="sm">
                <AvatarImage src={member.avatar_url ?? undefined} alt={member.name} />
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 && <AvatarGroupCount className="text-xs">+{overflow}</AvatarGroupCount>}
          </AvatarGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {project.completed_tasks}/{project.total_tasks} tasks complete
              </span>
            </div>
            <span className="font-medium text-slate-800">{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
