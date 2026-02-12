'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding';

const STEPS = [
  {
    title: 'Create or Join a Project',
    description: 'Start by creating a project for your class team or joining with an invite code.',
  },
  {
    title: 'Set Your Availability',
    description: 'Use the availability grid to mark when you can meet each week.',
  },
  {
    title: 'Find Team Meeting Times',
    description: 'Open the schedule view to see overlap and pick a slot that works for everyone.',
  },
  {
    title: 'Assign and Track Tasks',
    description: 'Break work into tasks, assign owners, and keep the team aligned on progress.',
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!hasSeenOnboarding()) {
      const timer = window.setTimeout(() => setOpen(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const isLastStep = step === STEPS.length - 1;
  const current = useMemo(() => STEPS[step], [step]);

  const dismiss = () => {
    markOnboardingSeen();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        dismiss();
        return;
      }
      setOpen(nextOpen);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription>{current.description}</DialogDescription>
        </DialogHeader>

        <div className="text-xs text-slate-500">
          Step {step + 1} of {STEPS.length}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button type="button" variant="ghost" onClick={dismiss}>
            Skip
          </Button>
          {isLastStep ? (
            <Button type="button" onClick={dismiss}>
              Got it
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep((prev) => prev + 1)}>
              Next
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
