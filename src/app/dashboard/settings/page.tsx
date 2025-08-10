import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import ClientForm from "./ClientForm";

const DEFAULT_TYPES = [
  "creative",
  "journal",
  "mindset",
  "reflection",
  "challenge",
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch current preferences
  const { data } = await supabase
    .from("users")
    .select("quest_preference")
    .eq("id", user.id)
    .single();
  const questPreference: string[] = data?.quest_preference || [];
  const selected = questPreference.filter((t) => DEFAULT_TYPES.includes(t));
  const custom = questPreference.find((t) => !DEFAULT_TYPES.includes(t)) || "";

  return (
    <div className="container mx-auto px-4 py-8 bg-black text-white">
      <div className="max-w-lg mx-auto mt-8 p-8 bg-black/70 text-white rounded border border-white/20 shadow-none">
        <h1 className="text-2xl font-bold mb-4 text-white">Settings</h1>
        <ClientForm selected={selected} custom={custom} />
      </div>
    </div>
  );
}
