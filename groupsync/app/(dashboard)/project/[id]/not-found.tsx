import Link from 'next/link';
import { FolderX } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ProjectNotFound() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 text-center">
          <FolderX className="mx-auto h-12 w-12 text-slate-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Project not found</h1>
          <p className="mt-2 text-slate-600">This project doesn&apos;t exist or you don&apos;t have access.</p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
