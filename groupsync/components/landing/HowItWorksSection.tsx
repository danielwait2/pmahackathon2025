import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    title: 'Create your project',
    subtitle: '30 seconds',
    description: 'Name it, set a deadline, choose your communication preferences.',
  },
  {
    title: 'Invite your team',
    subtitle: 'Share a link',
    description: 'Send a 6-character code or shareable link to your teammates.',
  },
  {
    title: 'Align and build',
    subtitle: 'Start collaborating',
    description: 'Set availability, manage tasks, and agree on expectations together.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-blue-50/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Up and running in 3 steps
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="border-blue-100 bg-white">
              <CardContent className="p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm font-medium text-emerald-600">{step.subtitle}</p>
                <p className="mt-3 text-slate-600">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
