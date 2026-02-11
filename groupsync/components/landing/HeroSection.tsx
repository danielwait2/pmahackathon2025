import Link from 'next/link';
import { ArrowRight, Calendar, CheckSquare, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pb-20">
        <nav className="mb-14 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-600">
            GroupSync
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Built for student teams
            </span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Stop fighting schedules. Start building together.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-slate-600">
              GroupSync helps student teams align schedules, set expectations, and track progress in under 2 minutes.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Link href="/login">Join a Project</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-xl shadow-blue-100/40">
            <div className="rounded-xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 p-5 text-white">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">CS 340 Capstone Team</h2>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  On Track
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-white/10 p-3">
                  <Calendar className="mb-2 h-4 w-4 text-blue-200" />
                  <p className="text-xs uppercase tracking-wide text-blue-200">Best Meeting</p>
                  <p className="text-sm font-semibold">Thu 3:00 PM</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <CheckSquare className="mb-2 h-4 w-4 text-blue-200" />
                  <p className="text-xs uppercase tracking-wide text-blue-200">Tasks Done</p>
                  <p className="text-sm font-semibold">12 / 18</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3">
                  <Users className="mb-2 h-4 w-4 text-blue-200" />
                  <p className="text-xs uppercase tracking-wide text-blue-200">Team Aligned</p>
                  <p className="text-sm font-semibold">4 / 5 Members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
