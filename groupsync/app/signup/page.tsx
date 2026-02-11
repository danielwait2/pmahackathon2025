import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="animate-pulse rounded-lg bg-slate-200 w-96 h-64" />}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
