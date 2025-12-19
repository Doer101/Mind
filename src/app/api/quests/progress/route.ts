import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { quest_id, progress } = body;

  const { error } = await supabase.from("user_quest_progress").upsert(
    [
      {
        user_id: user.id,
        quest_id,
        progress,
        completed: progress >= 100,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      },
    ],
    {
      onConflict: "user_id,quest_id",
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If completed, also update the quest's status
  if (progress >= 100) {
    console.log(`Quest ${quest_id} completed, updating status to completed`);

    await supabase
      .from("quests")
      .update({ status: "completed" })
      .eq("id", quest_id)
      .eq("user_id", user.id);

    // Fetch the quest to get xp_reward and category
    const { data: quest } = await supabase
      .from("quests")
      .select("xp_reward, quest_category, sub_module_id")
      .eq("id", quest_id)
      .eq("user_id", user.id)
      .single();

    if (quest && quest.xp_reward) {
      const isCore = quest.quest_category === 'core';
      
      // Fetch level requirements to handle leveling up
      const { data: levels } = await supabase
        .from("user_levels")
        .select("*")
        .order("level", { ascending: true });

      const calculateLevel = (xp: number) => {
        let level = 1;
        if (levels && levels.length > 0) {
          for (let i = 0; i < levels.length; i++) {
            if (xp >= levels[i].xp_required) {
              level = levels[i].level;
            } else {
              break;
            }
          }
        }
        return level;
      };

      if (isCore && quest.sub_module_id) {
        // Fetch fieldId from submodule hierarchy
        const { data: subModule } = await supabase
          .from("sub_modules")
          .select("modules!inner(field_id)")
          .eq("id", quest.sub_module_id)
          .single();

        const fieldId = (subModule as any)?.modules?.field_id;

        if (fieldId) {
          // 1. Increment Field XP (100% of reward) and Level
          const { data: fieldProgress } = await supabase
            .from("user_field_progress")
            .select("field_xp, field_level")
            .eq("user_id", user.id)
            .eq("field_id", fieldId)
            .single();

          if (fieldProgress) {
            const newFieldXP = (fieldProgress.field_xp || 0) + quest.xp_reward;
            const newFieldLevel = calculateLevel(newFieldXP);
            
            await supabase
              .from("user_field_progress")
              .update({ 
                field_xp: newFieldXP,
                field_level: newFieldLevel 
              })
              .eq("user_id", user.id)
              .eq("field_id", fieldId);
          }
        }

        // 2. Increment Global XP (70% of reward) and Level
        const { data: globalProgress } = await supabase
          .from("user_global_progress")
          .select("global_xp, global_level")
          .eq("user_id", user.id)
          .single();

        if (globalProgress) {
          const newGlobalXP = (globalProgress.global_xp || 0) + Math.round(quest.xp_reward * 0.7);
          const newGlobalLevel = calculateLevel(newGlobalXP);
          
          await supabase
            .from("user_global_progress")
            .update({ 
              global_xp: newGlobalXP,
              global_level: newGlobalLevel
            })
            .eq("user_id", user.id);
        }
        
        console.log(`Awarded ${quest.xp_reward} Field XP and ${Math.round(quest.xp_reward * 0.7)} Global XP for Core Quest`);
      } else {
        // Side Quest: 30% Global XP, 0% Field XP
        const { data: globalProgress } = await supabase
          .from("user_global_progress")
          .select("global_xp, global_level")
          .eq("user_id", user.id)
          .single();

        if (globalProgress) {
          const newGlobalXP = (globalProgress.global_xp || 0) + Math.round(quest.xp_reward * 0.3);
          const newGlobalLevel = calculateLevel(newGlobalXP);
          
          await supabase
            .from("user_global_progress")
            .update({ 
              global_xp: newGlobalXP,
              global_level: newGlobalLevel
            })
            .eq("user_id", user.id);
        }
        console.log(`Awarded ${Math.round(quest.xp_reward * 0.3)} Global XP for Side Quest`);
      }
    }
  }

  return NextResponse.json({ success: true });
}
