import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function escapeLikeInput(value: string) {
  return value.replace(/[%_]/g, '\\$&');
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('query') ?? '').trim();

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const isEmailQuery = query.includes('@');
  const safeQuery = escapeLikeInput(query);

  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
      OR: [
        {
          isPublic: true,
          OR: [
            { name: { contains: safeQuery, mode: 'insensitive' } },
            { email: { contains: safeQuery, mode: 'insensitive' } },
          ],
        },
        ...(isEmailQuery
          ? [
              {
                email: { equals: query, mode: 'insensitive' as const },
              },
            ]
          : []),
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(users);
}
