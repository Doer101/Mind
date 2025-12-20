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

    // SAFE UPDATE: Explicit allowlist, NO name update
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

// === ISOLATED USERNAME LOGIC ===
async function _updateUsername(userId: string, newName: string) {
  const supabase = await createClient();
  
  if (!newName) return; // Never set to null/empty

  // Validate format again (double safety)
  if (!/^[a-z0-9_]+$/.test(newName)) {
    throw new Error("Invalid username format.");
  }

  // Check uniqueness
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("name", newName)
    .neq("id", userId)
    .maybeSingle();

  if (existingUser) {
    throw new Error("Username is already taken.");
  }

  // EXPLICIT UPDATE: Only name
  const { data, error } = await supabase
    .from("users")
    .update({ name: newName })
    .eq("id", userId)
    .select();

  if (error) throw error;
  
  if (!data || data.length === 0) {
    throw new Error("Database validation failed: No rows updated.");
  }
  
  return true;
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

    const name = formData.get("name") as string;
    const fullName = formData.get("full_name") as string;
    const bio = formData.get("bio") as string;
    const website = formData.get("website") as string;

    // Fetch current user details
    const { data: currentUserData } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    
    // 1. Isolated Username Update
    if (name && name.trim() !== "" && name !== currentUserData?.name) {
      try {
        await _updateUsername(user.id, name);
      } catch (e: any) {
        return { error: e.message || "Failed to update username." };
      }
    }

    // 2. Safe Profile Update (Explicit Whitelist, NO NAME)
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
    revalidatePath("/dashboard");
    return { success: "Profile updated successfully!" };
  } catch (error: any) {
    return { error: error.message };
  }
}