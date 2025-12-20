"use server";

import { createClient } from "@/supabase/server";

export async function getLeagueData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch current user's global progress
  const { data: globalProgress, error } = await supabase
    .from("user_global_progress")
    .select("global_xp, global_level, league")
    .eq("user_id", user.id)
    .single();

  if (error || !globalProgress) {
    console.error("Error fetching global progress:", error);
    return null;
  }

  // 2. Calculate user's rank in the league
  const { count: higherXPCount } = await supabase
    .from("user_global_progress")
    .select("*", { count: "exact", head: true })
    .eq("league", globalProgress.league)
    .gt("global_xp", globalProgress.global_xp);

  const rank = (higherXPCount || 0) + 1;

  // 3. Fetch user name from users table (authoritative source)
  const { data: userData } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return {
    ...globalProgress,
    rank,
    fullName: userData?.full_name || user.email,
    userId: user.id
  };
}

export async function getLeagueLeaderboard(league: string) {
  const supabase = await createClient();

  // 1. Fetch league users from user_global_progress
  const { data: progressData, error: progressError } = await supabase
    .from("user_global_progress")
    .select("user_id, global_xp, global_level")
    .eq("league", league)
    .order("global_xp", { ascending: false })
    .limit(100);

  if (progressError) {
    console.error("Error fetching leaderboard progress:", progressError);
    return [];
  }

  if (!progressData || progressData.length === 0) return [];

  // 2. Extract user_ids
  const userIds = progressData.map(p => p.user_id);

  // 3. Fetch matching users from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", userIds);

  if (userError) {
    console.error("Error fetching leaderboard users:", userError);
  }

  // 4. Merge results in application code
  const userMap = new Map((userData || []).map(u => [u.id, u.full_name || "Anonymous"]));

  return progressData.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id,
    fullName: userMap.get(entry.user_id) || "Anonymous",
    globalLevel: entry.global_level,
    globalXP: entry.global_xp,
  }));
}
