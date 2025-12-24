import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  // 1. Fetch all today's daily quests (not penalty) using date range
  const { data: todaysDailyQuests, error: questError } = await supabase
    .from("quests")
    .select("id")
    .gte("for_date", startOfDay.toISOString())
    .lte("for_date", endOfDay.toISOString())
    .neq("type", "penalty")
    .eq("user_id", user.id);
  const todaysDailyQuestIds = (todaysDailyQuests || []).map(q => q.id);

  // 2. Fetch all completed progress for those quest IDs
  let dailyCompleted = 0;
  if (todaysDailyQuestIds.length > 0) {
    const { data: completedProgress, error: progressError } = await supabase
      .from("user_quest_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("completed", true)
      .in("quest_id", todaysDailyQuestIds);
    dailyCompleted = (completedProgress || []).length;
  }
  const dailyTotal = 9; // Always show max daily quests

  // Fetch all completed quests for the user (Side Quests Only for Stats)
  const { data: allCompleted } = await supabase
    .from("user_quest_progress")
    .select("id")
    .eq("user_id", user.id)
    .eq("completed", true);

  const totalCompleted = (allCompleted || []).length;

  return NextResponse.json({
    dailyCompleted,
    dailyTotal,
    totalCompleted,
  });
} 