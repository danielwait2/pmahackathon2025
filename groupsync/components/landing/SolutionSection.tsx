import { Calendar, CheckSquare, Handshake, Sparkles } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Find times that work for everyone with visual availability overlap.',
  },
  {
    icon: CheckSquare,
    title: 'Task Clarity',
    description: "Know who's doing what and when with kanban boards and assignments.",
  },
  {
    icon: Handshake,
    title: 'Team Agreements',
    description: "Set expectations upfront so everyone's aligned from day one.",
  },
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Get task suggestions tailored to your project type and deadline.',
  },
];

export function SolutionSection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Everything your team needs in one place
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader>
                <feature.icon className="mb-2 h-8 w-8 text-emerald-500" />
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
