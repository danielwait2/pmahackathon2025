import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AvailabilityTabProps {
  memberCount: number;
}

export function AvailabilityTab({ memberCount }: AvailabilityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p>Availability grid and meeting finder are next in the roadmap.</p>
        <p>{memberCount} team members will be shown in overlap view once that is wired.</p>
      </CardContent>
    </Card>
  );
}
