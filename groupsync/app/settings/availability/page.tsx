import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AvailabilitySettingsClient } from '@/components/settings/AvailabilitySettingsClient';

function toJsonSlots(raw: string | null | undefined) {
  if (!raw) return '[]';
  try {
    const parsed = JSON.parse(raw);
    return JSON.stringify(Array.isArray(parsed) ? parsed : []);
  } catch {
    return '[]';
  }
}

export default async function AvailabilitySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [defaultAvailability, blocks, token] = await Promise.all([
    prisma.userAvailabilityDefault.findUnique({
      where: { userId: session.user.id },
      select: { slots: true },
    }),
    prisma.userAvailabilityBlock.findMany({
      where: { userId: session.user.id },
      orderBy: [{ day: 'asc' }, { startHour: 'asc' }],
      select: { id: true, day: true, startHour: true, endHour: true },
    }),
    prisma.userCalendarToken.findUnique({
      where: { userId: session.user.id },
      select: { userId: true, expiryDate: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <AvailabilitySettingsClient
          initialSlotsJson={toJsonSlots(defaultAvailability?.slots)}
          initialBlocks={blocks}
          isGoogleConnected={!!token}
        />
      </div>
    </main>
  );
}
