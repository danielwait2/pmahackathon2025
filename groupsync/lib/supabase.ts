import { createBrowserClient, createServerClient } from '@supabase/ssr';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const missing = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !anonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ');

    throw new Error(
      `Missing Supabase environment variables: ${missing}. Add them to groupsync/.env.local and restart the dev server.`
    );
  }

  return { url, anonKey };
}

// Browser client - used in Client Components ('use client')
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(
    url,
    anonKey
  );
}

// Server client - used in Server Components, Route Handlers, and Middleware
export async function createServerSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - can't set cookies, ignore
          }
        },
      },
    }
  );
}
