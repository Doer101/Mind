"use server";
import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePreferences(
  prevState: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const selected = formData.getAll("quest_type") as string[];
    const custom = formData.get("custom") as string;
    const notifications = formData.get("notifications") === "on";

    let prefs = [...selected];
    if (custom && custom.trim()) {
      prefs.push(custom.trim());
    }

    if (prefs.length === 0) {
      return { error: "Please select or enter at least one quest type." };
    }

    const { error } = await supabase
      .from("users")
      .update({
        quest_preference: prefs,
        notifications_enabled: notifications,
      })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: "Preferences updated successfully!" };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProfile(
  prevState: { error?: string; success?: string },
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Not authenticated" };
    }

    const fullName = formData.get("full_name") as string;
    const bio = formData.get("bio") as string;
    const website = formData.get("website") as string;

    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName,
        bio: bio,
        website: website,
      })
      .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard"); // In case profile is shown elsewhere
    return { success: "Profile updated successfully!" };
  } catch (error: any) {
    return { error: error.message };
  }
}