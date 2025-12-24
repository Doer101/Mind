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

  // Fetch side quest progress
  const { data: sideQuestProgress, error: sideError } = await supabase
    .from("user_quest_progress")
    .select("*")
    .eq("user_id", user.id);

  // Fetch core quest progress
  const { data: coreQuestProgress, error: coreError } = await supabase
    .from("user_module_quest_progress")
    .select("*")
    .eq("user_id", user.id);

  if (sideError || coreError) {
    return NextResponse.json({ 
      error: sideError?.message || coreError?.message 
    }, { status: 500 });
  }

  // Map core quest progress to use module_quest_template_id as quest_id for compatibility
  const mappedCoreProgress = (coreQuestProgress || []).map(p => ({
    ...p,
    quest_id: p.module_quest_template_id
  }));

  // Merge both progress arrays
  const allProgress = [...(sideQuestProgress || []), ...mappedCoreProgress];

  return NextResponse.json({ progress: allProgress });
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

  // STEP 1: Determine if this is a core quest or side quest
  const { data: templateQuest } = await supabase
    .from("module_quest_templates")
    .select("id, xp_reward, sub_module_id")
    .eq("id", quest_id)
    .single();

  const isCore = !!templateQuest;

  if (isCore) {
    // ============================================================
    // CORE QUEST LOGIC - Use user_module_quest_progress
    // ============================================================
    
    // Core quests are atomic - only track completion, not progress
    // Only insert when quest is completed (progress >= 100)
    if (progress >= 100) {
      const { error: progressError } = await supabase
        .from("user_module_quest_progress")
        .upsert(
          {
            user_id: user.id,
            module_quest_template_id: quest_id,
            completed: true,
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,module_quest_template_id",
          }
        );

      if (progressError) {
        console.error("Error updating core quest progress:", progressError);
        return NextResponse.json({ error: progressError.message }, { status: 500 });
      }
    } else {
      // For progress < 100, we don't insert anything since core quests are atomic
      // Just return success without updating the database
      return NextResponse.json({ success: true });
    }

    // Award XP (we only reach here if progress >= 100)
    if (templateQuest.xp_reward) {
      console.log(`Core quest ${quest_id} completed, awarding XP`);

      // Fetch level requirements
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

      // Fetch fieldId from sub_module hierarchy
      if (templateQuest.sub_module_id) {
        const { data: subModule } = await supabase
          .from("sub_modules")
          .select("modules!inner(field_id)")
          .eq("id", templateQuest.sub_module_id)
          .single();

        const fieldId = (subModule as any)?.modules?.field_id;

        if (fieldId) {
          // 1. Award 100% Field XP
          const { data: fieldProgress } = await supabase
            .from("user_field_progress")
            .select("field_xp, field_level")
            .eq("user_id", user.id)
            .eq("field_id", fieldId)
            .single();

          if (fieldProgress) {
            const newFieldXP = (fieldProgress.field_xp || 0) + templateQuest.xp_reward;
            const newFieldLevel = calculateLevel(newFieldXP);

            await supabase
              .from("user_field_progress")
              .update({
                field_xp: newFieldXP,
                field_level: newFieldLevel,
              })
              .eq("user_id", user.id)
              .eq("field_id", fieldId);

            console.log(`Awarded ${templateQuest.xp_reward} Field XP (new total: ${newFieldXP}, level: ${newFieldLevel})`);
          }
        }
      }

      // 2. Award 70% Global XP
      const { data: globalProgress } = await supabase
        .from("user_global_progress")
        .select("global_xp, global_level")
        .eq("user_id", user.id)
        .single();

      if (globalProgress) {
        const globalXPReward = Math.round(templateQuest.xp_reward * 0.7);
        const newGlobalXP = (globalProgress.global_xp || 0) + globalXPReward;
        const newGlobalLevel = calculateLevel(newGlobalXP);

        await supabase
          .from("user_global_progress")
          .update({
            global_xp: newGlobalXP,
            global_level: newGlobalLevel,
          })
          .eq("user_id", user.id);

        console.log(`Awarded ${globalXPReward} Global XP (new total: ${newGlobalXP}, level: ${newGlobalLevel})`);
      }
    }

    return NextResponse.json({ success: true });
  } else {
    // ============================================================
    // SIDE QUEST LOGIC - Use user_quest_progress (UNCHANGED)
    // ============================================================
    
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
      console.log(`Side quest ${quest_id} completed, updating status`);

      await supabase
        .from("quests")
        .update({ status: "completed" })
        .eq("id", quest_id)
        .eq("user_id", user.id);

      // Fetch quest metadata for XP calculation
      const { data: sideQuest } = await supabase
        .from("quests")
        .select("xp_reward")
        .eq("id", quest_id)
        .eq("user_id", user.id)
        .single();

      if (sideQuest && sideQuest.xp_reward) {
        // Fetch level requirements
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

        // Side Quest: 70% Global XP only
        const { data: globalProgress } = await supabase
          .from("user_global_progress")
          .select("global_xp, global_level")
          .eq("user_id", user.id)
          .single();

        if (globalProgress) {
          const globalXPReward = Math.round(sideQuest.xp_reward * 0.7);
          const newGlobalXP = (globalProgress.global_xp || 0) + globalXPReward;
          const newGlobalLevel = calculateLevel(newGlobalXP);

          await supabase
            .from("user_global_progress")
            .update({
              global_xp: newGlobalXP,
              global_level: newGlobalLevel,
            })
            .eq("user_id", user.id);

          console.log(`Awarded ${globalXPReward} Global XP for Side Quest`);
        }

        // Also update users.user_xp (legacy field)
        await supabase.rpc("increment_user_xp", {
          user_id: user.id,
          xp_amount: sideQuest.xp_reward,
        });
      }
    }

    return NextResponse.json({ success: true });
  }
}
