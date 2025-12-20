"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPublicProfile(username: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 1. Fetch user by username
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, full_name, bio, website, avatar_url")
    .eq("name", username)
    .single();

  if (userError || !user) return null;

  // 2. Fetch global progress
  const { data: globalProgress, error: globalError } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  // 3. Fetch ALL fields
  const { data: allFields } = await supabase
    .from("fields")
    .select("id, name");

  // 4. Fetch field progress (only unlocked fields)
  const { data: fieldProgress, error: fieldError } = await supabase
    .from("user_field_progress")
    .select("field_id, field_xp, field_level, unlocked")
    .eq("user_id", user.id)
    .eq("unlocked", true);

  if (fieldError) {
    console.error("Error fetching field progress:", fieldError);
  }

  // 5. Fetch follower/following counts
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  // 6. Check if current user is following
  let isFollowing = false;
  if (currentUser) {
    const { data: follow } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", currentUser.id)
      .eq("following_id", user.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  // Process field progress data to ensure complete dataset for radar chart
  const processedFields = (allFields || []).map(field => {
    const progress = (fieldProgress || []).find(p => p.field_id === field.id);
    return {
      id: field.id,
      name: field.name,
      level: progress ? progress.field_level : 0, // 0 for locked fields
      xp: progress ? progress.field_xp : 0,
      unlocked: progress ? progress.unlocked : false
    };
  });

  // Find max unlocked level for radar normalization
  const maxLevel = Math.max(...processedFields.map(f => f.level), 1);

  return {
    user,
    globalProgress,
    fieldProgress: processedFields,
    maxLevel,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    isFollowing,
    isCurrentUser: currentUser?.id === user.id
  };
}

export async function toggleFollow(followingId: string) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: "Not authenticated" };
  if (currentUser.id === followingId) return { error: "You cannot follow yourself" };

  // Check current status
  const { data: existingFollow } = await supabase
    .from("user_follows")
    .select("*")
    .eq("follower_id", currentUser.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow
    await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", followingId);
  } else {
    // Follow
    await supabase
      .from("user_follows")
      .insert({
        follower_id: currentUser.id,
        following_id: followingId
      });
  }

  revalidatePath(`/u`); // Revalidate all profile routes
  return { success: true };
}

export async function searchUsers(query: string) {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm || searchTerm.length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, full_name, avatar_url")
    .ilike("name", `%${searchTerm}%`)
    .limit(10);

  if (error) {
    console.error("Search error:", error);
    return [];
  }

  return data;
}
