import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Fetch all user quest progress for today
  const { data: dailyProgress } = await supabase
    .from("user_quest_progress")
    .select("*, quests!inner(created_at)")
    .eq("user_id", user.id)
    .gte("quests.created_at", today.toISOString())
    .lt("quests.created_at", tomorrow.toISOString());

  // Daily completed and total
  const dailyCompleted = (dailyProgress || []).filter(q => q.completed).length;
  const dailyTotal = (dailyProgress || []).length;

  // Fetch all completed quests for the user
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