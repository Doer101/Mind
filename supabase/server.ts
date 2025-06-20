import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        set: async (name: string, value: string, options: { path?: string; maxAge?: number }) => {
          await cookieStore.set(name, value, options);
        },
        remove: async (name: string, options: { path?: string }) => {
          await cookieStore.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
};
