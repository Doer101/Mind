import { createClient } from "@/supabase/server";
import { cookies } from "next/headers";
import { QuestSystem } from "@/components/quest-system";
import { redirect } from "next/navigation";

export default async function QuestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get the host from the request headers
  const host = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = `${host}/api/quests`;

  return (
    <div className="container mx-auto py-8">
      <QuestSystem userId={user.id} apiUrl={apiUrl} />
    </div>
  );
}