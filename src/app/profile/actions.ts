"use server";

import { createClient } from "@/supabase/server";

export async function getMyProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // 1. Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, full_name, bio, website, avatar_url")
    .eq("id", user.id)
    .single();

  if (userError || !userData) return null;

  // 2. Fetch global progress
  const { data: globalProgress } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  // 3. Fetch ALL fields
  const { data: allFields } = await supabase
    .from("fields")
    .select("id, name");

  // 4. Fetch field progress (unlocked only)
  const { data: fieldProgress } = await supabase
    .from("user_field_progress")
    .select("field_id, field_xp, field_level, unlocked")
    .eq("user_id", user.id)
    .eq("unlocked", true);

  // 5. Fetch follower/following counts
  const { count: followersCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", user.id);

  const { count: followingCount } = await supabase
    .from("user_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", user.id);

  // Process fields to ensure complete dataset for radar chart
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

  const maxLevel = Math.max(...processedFields.map(f => f.level), 1);

  return {
    user: userData,
    globalProgress,
    fieldProgress: processedFields,
    maxLevel,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0
  };
}
