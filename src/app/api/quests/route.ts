import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  throw new Error("Missing HUGGINGFACE_API_KEY environment variable");
}

const client = new InferenceClient(HF_API_KEY);


// === AI SYSTEM PROMPT ===
const QUEST_GENERATION_RULES = `You are a Quest Generation AI for a gamified creativity platform called MindMuse. Your job is to create engaging, bite-sized daily quests for users, inspired by the concept of Solo Leveling. Follow these exact rules strictly:

RULES:
1. NEVER include your thinking process, reasoning, or system commentary
2. NEVER use markdown, special characters, or hashtags
3. DO NOT generate more than 5 quests per user per day
4. Keep each quest short (1–2 lines max) but specific and action-oriented
5. Ensure a clear goal is included (e.g., "Write", "Create", "Reflect")
6. Only use casual language that is motivating, playful, or slightly challenging
7. Do NOT repeat quest types in the same batch unless varied in content
8. Each quest must be unique and feel fresh (avoid boring templates)
9. Do NOT reference MindMuse, AI, or yourself in the tasks
10. Avoid overuse of emojis (max 1 emoji per quest, only if it fits)
11. Maintain a tone that is fun, daring, and slightly mysterious, like a quest master
12. Quests must align with creativity, self-growth, or reflection themes
13. NEVER include "Step 1", "Step 2", or numbered instructions inside a quest

STRUCTURE (per quest):
- Title: [One catchy title, 3-5 words max, action-oriented]
- Description: [One clear instruction, max 20 words, focused on journaling or creative action]
- Type: [creative | journal | mindset | reflection | challenge]
- XP: [value between 5 and 20]
- DeadlineHours: [usually 24]

EXAMPLE FORMAT:
{
  "title": "Face Your Fear",
  "description": "Write a short entry about something you've been avoiding and why.",
  "type": "reflection",
  "xp": 10,
  "deadlineHours": 24
}

OUTPUT:
Always return a JSON array of 3 to 5 quests in the above format. Nothing else.`;

// === CALL HYPERBOLIC DEEPSEEK API ===
async function callDeepSeekAPI(messages: any[]) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}

// === GENERATE QUESTS WITH AI ===
async function generateQuests(): Promise<Quest[]> {
  try {
    const messages = [
      { role: "system", content: QUEST_GENERATION_RULES },
      { role: "user", content: "Generate 3 creative quests for today." },
    ];

    const response = await callDeepSeekAPI(messages);
    console.log("AI Raw Response:", response);

    // Extract only the JSON array from the response using RegExp
    const jsonMatch = response?.match(/\[\s*{[\s\S]*?}\s*\]/);

    if (!jsonMatch) {
      throw new Error("No valid JSON array found in AI response."); 
    }

    const quests: Quest[] = JSON.parse(jsonMatch[0]);
    return quests;
  } catch (error) {
    console.error("Error generating quests:", error);
    throw error;
  }
}
// === GET (fetch or create quests if missing) ===
export async function GET() {
  try {
    console.log("GET /api/quests - Fetching quests");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all active daily quests for the user
    const { data: quests, error: questError } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (questError) {
      console.error("Error fetching quests:", questError);
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
    }

    // Separate daily and penalty quests
    const dailyQuests = (quests || []).filter(q => q.type !== "penalty");
    const penaltyQuests = (quests || []).filter(q => q.type === "penalty");

    // Check for expired, incomplete daily quests (deadline < now, not completed)
    const now = new Date();
    console.log("Current time:", now.toISOString());
    
    // Get yesterday's date (midnight)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    console.log("Yesterday midnight:", yesterday.toISOString());
    
    // Check for quests from yesterday or earlier that weren't completed
    const expiredQuests = dailyQuests.filter(q => {
      const deadline = new Date(q.deadline);
      const createdDate = new Date(q.created_at);
      const isExpired = deadline < now;
      const isFromYesterdayOrEarlier = createdDate < yesterday;
      const isNotCompleted = q.status !== "completed";
      
      console.log(`Quest ${q.id}: deadline=${deadline.toISOString()}, created=${createdDate.toISOString()}, expired=${isExpired}, fromYesterday=${isFromYesterdayOrEarlier}, completed=${!isNotCompleted}`);
      
      // A quest is considered for penalty if:
      // 1. It's expired (deadline passed) OR it's from yesterday/earlier
      // 2. AND it's not completed
      return (isExpired || isFromYesterdayOrEarlier) && isNotCompleted;
    });

    console.log(`Found ${expiredQuests.length} expired quests`);

    // For each expired, incomplete quest, generate a penalty quest if not already present
    for (const expired of expiredQuests) {
      const alreadyHasPenalty = penaltyQuests.some(pq => pq.penalty_for_quest_id === expired.id);
      console.log(`Quest ${expired.id} already has penalty: ${alreadyHasPenalty}`);
      
      if (!alreadyHasPenalty) {
        // 1. Move the missed quest to penalty type and mark as moved
        const { error: moveError } = await supabase
          .from("quests")
          .update({ type: "penalty", status: "moved-to-penalty" })
          .eq("id", expired.id)
          .eq("user_id", user.id);
        if (moveError) {
          console.error("Error moving missed quest to penalty type:", moveError);
        } else {
          console.log(`Moved quest ${expired.id} to penalty type.`);
        }

        // 2. Generate a new penalty quest using AI
        let penaltyTitle = `Penalty: ${expired.title}`;
        let penaltyDescription = `You missed this quest: ${expired.description}. Complete this penalty to redeem yourself!`;
        let penaltyType = "penalty";
        let penaltyXP = 5;
        let penaltyDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
        try {
          // Use AI to generate a penalty quest based on the missed quest
          const penaltyPrompt = [
            { role: "system", content: QUEST_GENERATION_RULES },
            { role: "user", content: `Generate 1 creative penalty quest for a user who missed this quest: '${expired.title}' - ${expired.description}. The penalty quest should be challenging and encourage the user to redeem themselves.` },
          ];
          const aiResponse = await callDeepSeekAPI(penaltyPrompt);
          const jsonMatch = aiResponse?.match(/\[\s*{[\s\S]*?}\s*\]/);
          if (jsonMatch) {
            const aiQuests = JSON.parse(jsonMatch[0]);
            if (Array.isArray(aiQuests) && aiQuests.length > 0) {
              penaltyTitle = aiQuests[0].title || penaltyTitle;
              penaltyDescription = aiQuests[0].description || penaltyDescription;
              penaltyType = "penalty"; // Always set as penalty
              penaltyXP = aiQuests[0].xp || penaltyXP;
              penaltyDeadline = new Date(now.getTime() + (aiQuests[0].deadlineHours || 24) * 60 * 60 * 1000).toISOString();
            }
          }
        } catch (err) {
          console.error("AI penalty quest generation failed, using fallback template.", err);
        }
        const { data: penaltyQuest, error: penaltyError } = await supabase.from("quests").insert({
          title: penaltyTitle,
          description: penaltyDescription,
          difficulty: "hard",
          xp_reward: penaltyXP,
          type: penaltyType,
          status: "active",
          user_id: user.id,
          progress: 0,
          deadline: penaltyDeadline,
          penalty_for_quest_id: expired.id,
        }).select();

        if (penaltyError) {
          console.error("Error creating penalty quest:", penaltyError);
        } else {
          console.log("Successfully created penalty quest:", penaltyQuest);
        }

        // 3. Deduct 20 XP from the user
        const { error: xpError } = await supabase.rpc("increment_user_xp", {
          uid: user.id,
          xp_amount: -20,
        });
        if (xpError) {
          console.error("Error deducting XP for missed quest:", xpError);
        } else {
          console.log("Deducted 20 XP from user for missed quest.");
        }
      }
    }

    // Re-fetch penalty quests in case new ones were added
    const { data: updatedPenaltyQuests, error: penaltyFetchError } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "penalty")
      .eq("status", "active");

    if (penaltyFetchError) {
      console.error("Error fetching penalty quests:", penaltyFetchError);
    }

    console.log(`Returning ${dailyQuests.length} daily quests and ${(updatedPenaltyQuests || []).length} penalty quests`);

    return NextResponse.json({
      dailyQuests,
      penaltyQuests: updatedPenaltyQuests || [],
    });
  } catch (error) {
    console.error("Error in GET /api/quests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// === POST (generate and insert new quests) ===
export async function POST() {
  try {
    console.log("POST /api/quests - Generating new quests");
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Enforce max 9 daily quests per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const { data: todaysQuests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .neq("type", "penalty")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());
    if ((todaysQuests?.length || 0) >= 9) {
      return NextResponse.json({ error: "You have reached the daily quest limit (9)." }, { status: 400 });
    }

    const generatedQuests = await generateQuests();

    // Only insert up to the remaining allowed quests
    const remaining = 9 - (todaysQuests?.length || 0);
    const questsToInsert = generatedQuests.slice(0, remaining).map(quest => ({
      title: quest.title,
      description: quest.description,
      difficulty: quest.xp > 15 ? "hard" : quest.xp > 10 ? "medium" : "easy",
      xp_reward: quest.xp,
      type: quest.type,
      status: "active",
      user_id: user.id,
      progress: 0,
      deadline: new Date(Date.now() + quest.deadlineHours * 60 * 60 * 1000).toISOString(),
    }));

    if (questsToInsert.length === 0) {
      return NextResponse.json({ error: "No more quests can be generated today." }, { status: 400 });
    }

    const { data: insertedQuests, error: insertError } = await supabase
      .from("quests")
      .insert(questsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting quests:", insertError);
      return NextResponse.json({ error: "Failed to insert quests" }, { status: 500 });
    }

    console.log("Successfully created quests:", insertedQuests.length);
    return NextResponse.json({ quests: insertedQuests });
  } catch (error) {
    console.error("Error in POST /api/quests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// === TYPE DEFINITIONS (optional, for TypeScript help) ===
type Quest = {
  title: string;
  description: string;
  type: "creative" | "journal" | "mindset" | "reflection" | "challenge";
  xp: number;
  deadlineHours: number;
};
