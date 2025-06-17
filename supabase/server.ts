import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: { path?: string; maxAge?: number }) {
          await cookieStore.set(name, value, options);
        },
        async remove(name: string, options: { path?: string }) {
          await cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
};
