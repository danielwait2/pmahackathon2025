import { prisma } from '@/lib/prisma';

interface BusyPeriod {
  start: string;
  end: string;
}

interface FreeBusyResponse {
  calendars?: Record<string, { busy?: BusyPeriod[] }>;
}

async function refreshAccessToken(userId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth is not configured');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Unable to refresh Google token');
  }

  const data = await response.json();
  const accessToken = data.access_token as string | undefined;
  const expiresIn = data.expires_in as number | undefined;
  if (!accessToken || !expiresIn) {
    throw new Error('Invalid Google token response');
  }

  const expiryDate = new Date(Date.now() + expiresIn * 1000);
  await prisma.userCalendarToken.update({
    where: { userId },
    data: { accessToken, expiryDate },
  });

  return accessToken;
}

export async function getValidGoogleAccessToken(userId: string) {
  const token = await prisma.userCalendarToken.findUnique({
    where: { userId },
  });
  if (!token) return null;

  if (token.expiryDate.getTime() > Date.now() + 60_000) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    return null;
  }

  return refreshAccessToken(userId, token.refreshToken);
}

export async function fetchGoogleBusyTimes(userId: string, timeMin: string, timeMax: string): Promise<BusyPeriod[]> {
  const accessToken = await getValidGoogleAccessToken(userId);
  if (!accessToken) {
    throw new Error('Google Calendar is not connected');
  }

  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: 'UTC',
      items: [{ id: 'primary' }],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Google busy times');
  }

  const data: FreeBusyResponse = await response.json();
  const busy = data.calendars?.primary?.busy ?? [];
  return busy;
}
