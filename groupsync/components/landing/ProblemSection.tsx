import { AlarmClock, CalendarClock, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

const problemStats = [
  {
    icon: CalendarClock,
    stat: '90%',
    description: 'say scheduling is their biggest frustration',
  },
  {
    icon: Users,
    stat: '90%',
    description: 'would use a tool that makes collaboration smoother',
  },
  {
    icon: AlarmClock,
    stat: 'Hours wasted',
    description: 'Students spend more time coordinating than creating',
  },
];

export function ProblemSection() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Group projects shouldn&apos;t be this hard
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {problemStats.map((item) => (
            <Card key={item.stat} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <item.icon className="h-8 w-8 text-blue-600" />
                <p className="text-3xl font-black text-slate-900">{item.stat}</p>
                <p className="text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Based on survey of 31 university students
        </p>
      </div>
    </section>
  );
}
