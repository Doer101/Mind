import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_quest_progress")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { quest_id, progress } = body;

  const { error } = await supabase
    .from("user_quest_progress")
    .upsert([
      {
        user_id: user.id,
        quest_id,
        progress,
        completed: progress >= 100,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      },
    ], {
      onConflict: "user_id,quest_id",
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If completed, also update the quest's status
  if (progress >= 100) {
    await supabase
      .from("quests")
      .update({ status: "completed" })
      .eq("id", quest_id)
      .eq("user_id", user.id);

    // Fetch the quest to get xp_reward
    const { data: quest } = await supabase
      .from("quests")
      .select("xp_reward")
      .eq("id", quest_id)
      .eq("user_id", user.id)
      .single();
    if (quest && quest.xp_reward) {
      const { error: xpError } = await supabase.rpc("increment_user_xp", {
        uid: user.id,
        xp_amount: quest.xp_reward,
      });
      if (xpError) {
        console.error("XP increment error:", xpError);
      }
    }
  }

  return NextResponse.json({ success: true });
} 