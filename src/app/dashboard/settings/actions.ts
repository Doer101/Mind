"use server";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePreferences(
  prevState: { error?: string; success?: string },
  formData: FormData
): Promise<{ error: string } | { success: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Not authenticated" };
  }
  const selected = formData.getAll("quest_type") as string[];
  const custom = formData.get("custom") as string;
  let prefs = [...selected];
  if (custom && custom.trim()) {
    prefs.push(custom.trim());
  }
  if (prefs.length === 0) {
    return { error: "Please select or enter at least one quest type." };
  }
  const { error } = await supabase
    .from("users")
    .update({ quest_preference: prefs })
    .eq("id", user.id);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  if (error) {
    return { error: error.message };
  }
  return { success: "Preferences updated successfully!" };
} 