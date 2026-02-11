import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Ready to make group work actually work?
        </h2>
        <p className="mt-3 text-blue-100">Free for students. No credit card needed.</p>
        <div className="mt-8">
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
            <Link href="/signup">Create Your First Project</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
