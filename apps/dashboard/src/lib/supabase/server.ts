import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('NEXT_PUBLIC_SUPABASE_URL and ANON_KEY required');
  const store = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet: { name: string; value: string; options?: import('@supabase/ssr').CookieOptions }[]) => {
        for (const { name, value, options } of toSet) {
          try {
            store.set(name, value, options);
          } catch {
            // Server Component context — ignore (refresh handled by middleware)
          }
        }
      },
    },
  });
}
