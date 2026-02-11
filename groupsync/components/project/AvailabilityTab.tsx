'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck2 } from 'lucide-react';
import { toast } from 'sonner';

import { Availability, AvailabilitySlot, ProjectMember } from '@/types';
import { createClient } from '@/lib/supabase';

import { AvailabilityGrid } from '@/components/project/AvailabilityGrid';
import { MeetingFinder } from '@/components/project/MeetingFinder';
import { TeamAvailability } from '@/components/project/TeamAvailability';

interface AvailabilityTabProps {
  projectId: string;
  members: Array<ProjectMember & { profile: { id: string; name: string; avatar_url: string | null } }>;
  availability: Availability[];
  currentUserId: string;
  isOwner: boolean;
}

export function AvailabilityTab({ projectId, members, availability, currentUserId, isOwner }: AvailabilityTabProps) {
  const [availabilityRecords, setAvailabilityRecords] = useState(availability);
  const [saving, setSaving] = useState(false);

  const myAvailability = useMemo(
    () => availabilityRecords.find((record) => record.user_id === currentUserId)?.slots ?? [],
    [availabilityRecords, currentUserId]
  );

  const saveAvailability = async (slots: AvailabilitySlot[]) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('availability')
        .upsert({ project_id: projectId, user_id: currentUserId, slots }, { onConflict: 'project_id,user_id' })
        .select()
        .single();

      if (error || !data) {
        toast.error(error?.message ?? 'Unable to save availability.');
        return;
      }

      setAvailabilityRecords((prev) => {
        const rest = prev.filter((record) => record.user_id !== currentUserId);
        return [...rest, data as Availability];
      });
      toast.success('Availability saved!');
    } catch {
      toast.error('Unable to save availability right now.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {myAvailability.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <CalendarCheck2 className="mt-0.5 h-5 w-5 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Add your availability to get better meeting suggestions.</p>
              <p className="text-sm text-slate-600">Fill in your schedule below, then click save.</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <AvailabilityGrid initialSlots={myAvailability} onSave={saveAvailability} saving={saving} />
        <TeamAvailability members={members} availability={availabilityRecords} />
      </div>
      <MeetingFinder members={members} availability={availabilityRecords} isOwner={isOwner} />
    </div>
  );
}
