import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

if (!HF_API_KEY) {
  throw new Error("Missing HUGGINGFACE_API_KEY environment variable");
}

const client = new InferenceClient(HF_API_KEY);

// === AI SYSTEM PROMPT ===
const QUEST_GENERATION_RULES = `You are a Quest Generation AI for a gamified creativity platform. Generate engaging, bite-sized daily quests for users. CRITICAL: ONLY OUTPUT A VALID JSON ARRAY OF QUESTS WITH NO COMMENTARY OR THINKING.

RULES:
1. CRITICAL: Output ONLY a JSON array of quests - NO thinking, reasoning, or commentary before or after
2. NO markdown, special characters, or hashtags
3. Generate exactly the number of quests requested (usually 3)
4. Keep each quest short (1-2 lines) and action-oriented
5. Include a clear goal (e.g., "Write", "Create", "Reflect")
6. Use casual, motivating language
7. Make each quest unique
8. Do NOT reference the platform or yourself
9. Maximum 1 emoji per quest (optional)
10. Align with creativity, self-growth, or reflection themes

STRUCTURE (per quest):
- title: Catchy, 3-5 words, action-oriented
- description: Clear instruction, max 20 words
- type: One of [creative, journal, mindset, reflection, challenge]
- xp: Value between 5-20
- deadlineHours: Usually 24

EXAMPLE OUTPUT:
[
  {
    "title": "Face Your Fear",
    "description": "Write about something you've been avoiding and why.",
    "type": "reflection",
    "xp": 10,
    "deadlineHours": 24
  }
]

OUTPUT ONLY THE JSON ARRAY. NO OTHER TEXT.`;

// === CALL HYPERBOLIC DEEPSEEK API ===
async function callDeepSeekAPI(messages: any[]) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages,
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.95,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}

// Helper function to get fallback quests
function getFallbackQuests(): Quest[] {
  return [
    {
      title: "Creative Challenge",
      description: "Create something new using your favorite tools or medium.",
      type: "creative",
      xp: 15,
      deadlineHours: 24
    },
    {
      title: "Reflect and Write",
      description: "Take 10 minutes to journal about your recent progress.",
      type: "journal",
      xp: 10,
      deadlineHours: 24
    },
    {
      title: "Learn Something New",
      description: "Spend time learning a new skill or concept today.",
      type: "challenge",
      xp: 15,
      deadlineHours: 24
    }
  ];
}

// Helper function to extract quest objects from raw text when JSON parsing fails
function extractQuestsFromRawResponse(response: string): Quest[] {
  const quests: Quest[] = [];
  
  // Try to find quest-like patterns in the text - more flexible patterns
  const titlePattern = /"title"\s*:\s*"([^"]*?)"/g;
  const descriptionPattern = /"description"\s*:\s*"([^"]*?)"/g;
  const typePattern = /"type"\s*:\s*"([^"]*?)"/g;
  const xpPattern = /"xp"\s*:\s*(\d*)/g;
  const deadlinePattern = /"deadlineHours"\s*:\s*(\d*)/g;
  
  // Extract all matches using exec() instead of matchAll() for compatibility
  const titles: string[] = [];
  let titleMatch;
  while ((titleMatch = titlePattern.exec(response)) !== null) {
    titles.push(titleMatch[1]);
  }
  
  const descriptions: string[] = [];
  let descMatch;
  while ((descMatch = descriptionPattern.exec(response)) !== null) {
    descriptions.push(descMatch[1]);
  }
  
  const types: string[] = [];
  let typeMatch;
  while ((typeMatch = typePattern.exec(response)) !== null) {
    types.push(typeMatch[1]);
  }
  
  const xps: number[] = [];
  let xpMatch;
  while ((xpMatch = xpPattern.exec(response)) !== null) {
    const xpValue = xpMatch[1] ? parseInt(xpMatch[1]) : 10;
    xps.push(xpValue);
  }
  
  const deadlines: number[] = [];
  let deadlineMatch;
  while ((deadlineMatch = deadlinePattern.exec(response)) !== null) {
    const deadlineValue = deadlineMatch[1] ? parseInt(deadlineMatch[1]) : 24;
    deadlines.push(deadlineValue);
  }
  
  // Create quest objects from extracted data
  const maxQuests = Math.max(titles.length, descriptions.length, types.length, xps.length, deadlines.length);
  
  // Valid quest types
  const validQuestTypes = ["creative", "journal", "mindset", "reflection", "challenge"];
  
  for (let i = 0; i < maxQuests; i++) {
    if (titles[i] && descriptions[i]) {
      // Normalize the quest type to ensure it's valid
      let questType = types[i]?.toLowerCase() || "challenge";
      if (!validQuestTypes.includes(questType as any)) {
        questType = "challenge"; // Default to challenge if invalid
      }
      
      quests.push({
        title: titles[i].trim() || "Unknown Quest",
        description: descriptions[i].trim() || "Complete this quest",
        type: questType as Quest["type"],
        xp: xps[i] || 10,
        deadlineHours: deadlines[i] || 24
      });
    }
  }
  
  // If we couldn't extract any quests, try a more lenient approach
  if (quests.length === 0) {
    // Look for any text that might be quest titles and descriptions
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.includes('title') && line.includes('description')) {
        const titleMatch = line.match(/title.*?:\s*["']?([^"'\n,]+)["']?/i);
        const descMatch = line.match(/description.*?:\s*["']?([^"'\n,]+)["']?/i);
        
        if (titleMatch && descMatch) {
          quests.push({
            title: titleMatch[1].trim(),
            description: descMatch[1].trim(),
            type: "challenge",
            xp: 10,
            deadlineHours: 24
          });
        }
      }
    }
  }
  
  // If still no quests, try to extract from incomplete JSON patterns
  if (quests.length === 0) {
    // Try to find any quest-like objects in the text
    const questObjectPattern = /\{\s*"title".*?\}/g;
    let questMatch;
    while ((questMatch = questObjectPattern.exec(response)) !== null) {
      const questText = questMatch[0];
      
      const titleMatch = questText.match(/"title"\s*:\s*"([^"]*?)"/);
      const descMatch = questText.match(/"description"\s*:\s*"([^"]*?)"/);
      const typeMatch = questText.match(/"type"\s*:\s*"([^"]*?)"/);
      const xpMatch = questText.match(/"xp"\s*:\s*(\d*)/);
      const deadlineMatch = questText.match(/"deadlineHours"\s*:\s*(\d*)/);
      
      if (titleMatch && descMatch) {
        let questType = typeMatch ? typeMatch[1].toLowerCase() : "challenge";
        if (!validQuestTypes.includes(questType as any)) {
          questType = "challenge";
        }
        
        quests.push({
          title: titleMatch[1].trim() || "Unknown Quest",
          description: descMatch[1].trim() || "Complete this quest",
          type: questType as Quest["type"],
          xp: xpMatch && xpMatch[1] ? parseInt(xpMatch[1]) : 10,
          deadlineHours: deadlineMatch && deadlineMatch[1] ? parseInt(deadlineMatch[1]) : 24
        });
      }
    }
  }
  
  return quests;
}

// === GENERATE QUESTS WITH AI ===
async function generateQuests(preference?: string[]): Promise<Quest[]> {
  try {
    let userPrefText = "";
    if (preference && preference.length > 0) {
      userPrefText = `Types: ${preference.join(", ")}. `;
    }
    const messages = [
      { role: "system", content: QUEST_GENERATION_RULES },
      {
        role: "user",
        content: `Generate 3 quests.${userPrefText}Remember: output ONLY JSON array.`,
      },
    ];

    const response = await callDeepSeekAPI(messages);
    // Log only first 100 chars to reduce console output
    console.log(
      "AI Response Preview:",
      response
        ? response.substring(0, 100) + (response.length > 100 ? "..." : "")
        : "No response"
    );

    if (!response) {
      throw new Error("Empty AI response received.");
    }

    // Remove thinking tags if present
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    // Try to extract a complete JSON array
    let jsonArray;
    
    // First attempt: Find a complete JSON array
    const completeMatch = cleanedResponse.match(/(\[[\s\S]*?\])/);
    if (completeMatch) {
      jsonArray = completeMatch[0];
    } else {
      // Second attempt: Find the start of a JSON array
      const startMatch = cleanedResponse.match(/(\[\s*{)/);
      if (startMatch) {
        // We found the start of an array, now try to complete it
        const startIndex = startMatch.index || 0;
        let partialJson = cleanedResponse.substring(startIndex);
        
        // Count open braces and brackets to ensure proper structure
        let openBraces = (partialJson.match(/{/g) || []).length;
        let closeBraces = (partialJson.match(/}/g) || []).length;
        let openBrackets = (partialJson.match(/\[/g) || []).length;
        let closeBrackets = (partialJson.match(/\]/g) || []).length;
        
        // Complete the JSON structure if needed
        let fixedJson = partialJson;
        
        // Close any open objects
        while (openBraces > closeBraces) {
          fixedJson += "}";
          closeBraces++;
        }
        
        // Close any open arrays
        while (openBrackets > closeBrackets) {
          fixedJson += "]";
          closeBrackets++;
        }
        
        jsonArray = fixedJson;
      } else {
        console.error("AI Response that failed parsing:", response);
        throw new Error("No valid JSON array found in AI response.");
      }
    }
    
    // Fix unquoted property names and values
    let processedJson = jsonArray
      // Fix unquoted property names
      .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/g, '$1"$2":')
      // Fix unquoted string values
      .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*([,}])/g, ':"$1"$2')
      // Fix unquoted array values
      .replace(/(\[|\s)([a-zA-Z_][a-zA-Z0-9_-]*)(\s*[,|\]])/g, '$1"$2"$3')
      // Fix incomplete deadlineHours (like "deadlineHours":} or "deadlineHours":])
      .replace(/"deadlineHours"\s*:\s*([,}\]])/g, '"deadlineHours":24$1')
      // Fix incomplete xp (like "xp":} or "xp":])
      .replace(/"xp"\s*:\s*([,}\]])/g, '"xp":10$1')
      // Fix incomplete type (like "type":} or "type":])
      .replace(/"type"\s*:\s*([,}\]])/g, '"type":"challenge"$1');
    
    let quests;
    try {
      quests = JSON.parse(processedJson);
      
      // Validate that we have a proper array of quests
      if (!Array.isArray(quests)) {
        throw new Error("Parsed result is not an array");
      }
      
      // Ensure each quest has the required properties
      quests = quests.filter(quest => 
        quest && 
        typeof quest === 'object' && 
        quest.title && 
        quest.description && 
        quest.type && 
        quest.xp
      );
      
      // If we have no valid quests after filtering, use fallback quests
      if (quests.length === 0) {
        console.warn("No valid quests after filtering, using fallback quests");
        quests = getFallbackQuests();
      }
      
      return quests;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Attempted to parse:", processedJson);
      
      // Try one more fallback: extract individual quest objects from the raw response
      try {
        console.warn("Attempting to extract individual quest objects from raw response");
        const questObjects = extractQuestsFromRawResponse(cleanedResponse);
        if (questObjects.length > 0) {
          console.log(`Successfully extracted ${questObjects.length} quests from raw response`);
          return questObjects;
        }
      } catch (extractionError) {
        console.error("Quest extraction from raw response also failed:", extractionError);
      }
      
      // Return fallback quests if all parsing attempts fail
      console.warn("Using fallback quests due to parsing error");
      const fallbackQuests = getFallbackQuests();
      
      // Ensure we return at least 3 quests (or whatever was requested)
      const targetCount = 3;
      if (fallbackQuests.length >= targetCount) {
        return fallbackQuests.slice(0, targetCount);
      } else {
        // If we don't have enough fallback quests, duplicate/modify them
        const extendedQuests = [...fallbackQuests];
        while (extendedQuests.length < targetCount) {
          const baseQuest = fallbackQuests[extendedQuests.length % fallbackQuests.length];
          extendedQuests.push({
            ...baseQuest,
            title: `${baseQuest.title} ${extendedQuests.length + 1}`,
            description: `${baseQuest.description} (Alternative ${extendedQuests.length + 1})`
          });
        }
        return extendedQuests;
      }
    }
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
      return NextResponse.json(
        { error: "Failed to fetch quests" },
        { status: 500 }
      );
    }

    // Separate daily and penalty quests
    const dailyQuests = (quests || []).filter((q) => q.type !== "penalty");
    const penaltyQuests = (quests || []).filter((q) => q.type === "penalty");

    // Check for expired, incomplete daily quests (deadline < now, not completed)
    const now = new Date();
    console.log("Current time:", now.toISOString());

    // Check for quests whose deadline has passed and are not completed
    const expiredQuests = dailyQuests.filter((q) => {
      const deadline = new Date(q.deadline);
      const isExpired = deadline < now;
      const isNotCompleted = q.status !== "completed";
      console.log(
        `Quest ${q.id}: deadline=${deadline.toISOString()}, expired=${isExpired}, completed=${!isNotCompleted}`
      );
      return isExpired && isNotCompleted;
    });

    console.log(`Found ${expiredQuests.length} expired quests`);

    // For each expired, incomplete quest, generate a penalty quest if not already present
    // Penalty quests are generated independently and don't count toward daily quest limits
    // They only block new quest generation if they're from previous days and incomplete
    for (const expired of expiredQuests) {
      const alreadyHasPenalty = penaltyQuests.some(
        (pq) => pq.penalty_for_quest_id === expired.id
      );
      console.log(
        `Quest ${expired.id} already has penalty: ${alreadyHasPenalty}`
      );

      if (!alreadyHasPenalty) {
        // 1. Move the missed quest to penalty type and mark as moved
        const { error: moveError } = await supabase
          .from("quests")
          .update({ type: "penalty", status: "moved-to-penalty" })
          .eq("id", expired.id)
          .eq("user_id", user.id);
        if (moveError) {
          console.error(
            "Error moving missed quest to penalty type:",
            moveError
          );
        } else {
          console.log(`Moved quest ${expired.id} to penalty type.`);
        }

        // 2. Generate a new penalty quest using AI
        let penaltyTitle = `Penalty: ${expired.title}`;
        let penaltyDescription = `You missed this quest: ${expired.description}. Complete this penalty to redeem yourself!`;
        let penaltyType = "penalty";
        let penaltyXP = 5;
        let penaltyDeadline = new Date(
          now.getTime() + 24 * 60 * 60 * 1000
        ).toISOString();
        try {
          // Use AI to generate a penalty quest based on the missed quest
          const penaltyPrompt = [
            { role: "system", content: QUEST_GENERATION_RULES },
            {
              role: "user",
              content: `Generate 1 penalty quest for: '${expired.title}' - ${expired.description}. Make it challenging. Output ONLY JSON array.`,
            },
          ];
          const aiResponse = await callDeepSeekAPI(penaltyPrompt);
          // Log only first 100 chars to reduce console output
          console.log(
            "Penalty AI Response Preview:",
            aiResponse
              ? aiResponse.substring(0, 100) +
                  (aiResponse.length > 100 ? "..." : "")
              : "No response"
          );
          
          if (!aiResponse) {
            console.warn("Empty AI response for penalty quest, using fallback");
          } else {
            // Use the same robust JSON parsing as the main generateQuests function
            const cleanedResponse = aiResponse.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
            
            // Try to extract a complete JSON array
            let jsonArray;
            
            // First attempt: Find a complete JSON array
            const completeMatch = cleanedResponse.match(/(\[[\s\S]*?\])/);
            if (completeMatch) {
              jsonArray = completeMatch[0];
            } else {
              // Second attempt: Find the start of a JSON array
              const startMatch = cleanedResponse.match(/(\[\s*{)/);
              if (startMatch) {
                // We found the start of an array, now try to complete it
                const startIndex = startMatch.index || 0;
                let partialJson = cleanedResponse.substring(startIndex);
                
                // Count open braces and brackets to ensure proper structure
                let openBraces = (partialJson.match(/{/g) || []).length;
                let closeBraces = (partialJson.match(/}/g) || []).length;
                let openBrackets = (partialJson.match(/\[/g) || []).length;
                let closeBrackets = (partialJson.match(/\]/g) || []).length;
                
                // Complete the JSON structure if needed
                let fixedJson = partialJson;
                
                // Close any open objects
                while (openBraces > closeBraces) {
                  fixedJson += "}";
                  closeBraces++;
                }
                
                // Close any open arrays
                while (openBrackets > closeBrackets) {
                  fixedJson += "]";
                  closeBrackets++;
                }
                
                jsonArray = fixedJson;
              } else {
                console.warn("No JSON array found in penalty response, using fallback");
              }
            }
            
            if (jsonArray) {
              // Fix unquoted property names and values
              let processedJson = jsonArray
                // Fix unquoted property names
                .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*:/g, '$1"$2":')
                // Fix unquoted string values
                .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_-]*)\s*([,}])/g, ':"$1"$2')
                // Fix unquoted array values
                .replace(/(\[|\s)([a-zA-Z_][a-zA-Z0-9_-]*)(\s*[,|\]])/g, '$1"$2"$3');
              
              try {
                const aiQuests = JSON.parse(processedJson);
                if (Array.isArray(aiQuests) && aiQuests.length > 0) {
                  penaltyTitle = aiQuests[0].title || penaltyTitle;
                  penaltyDescription = aiQuests[0].description || penaltyDescription;
                  penaltyType = "penalty"; // Always set as penalty
                  penaltyXP = aiQuests[0].xp || penaltyXP;
                  penaltyDeadline = new Date(
                    now.getTime() +
                      (aiQuests[0].deadlineHours || 24) * 60 * 60 * 1000
                  ).toISOString();
                }
              } catch (parseError) {
                console.error("Penalty JSON Parse Error:", parseError);
                console.error("Attempted to parse:", processedJson);
                // Continue with default values if parsing fails
              }
            }
          }
        } catch (err) {
          console.error(
            "AI penalty quest generation failed, using fallback template.",
            err
          );
        }

        // Create penalty quest WITHOUT quest_set_id (penalty quests are independent)
        // Penalty quests don't count toward the daily quest limit and are generated independently
        // They only block new quest generation if they're from previous days and incomplete
        const { data: penaltyQuest, error: penaltyError } = await supabase
          .from("quests")
          .insert({
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
            for_date: expired.for_date || expired.created_at.split("T")[0],
            // Note: penalty quests don't have quest_set_id - they're independent
          })
          .select();

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
    // Include both active penalty quests and quests that were moved to penalty status
    const { data: updatedPenaltyQuests, error: penaltyFetchError } =
      await supabase
        .from("quests")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "penalty")
        .in("status", ["active", "moved-to-penalty"]);

    if (penaltyFetchError) {
      console.error("Error fetching penalty quests:", penaltyFetchError);
    }

    console.log(
      `Returning ${dailyQuests.length} daily quests and ${(updatedPenaltyQuests || []).length} penalty quests`
    );

    return NextResponse.json({
      dailyQuests,
      penaltyQuests: updatedPenaltyQuests || [],
    });
  } catch (error) {
    console.error("Error in GET /api/quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// === POST (generate and insert new quests) ===
// This method generates new daily quests (3 per set, max 3 sets = 9 quests per day)
// Penalty quests are generated independently in the GET method and don't count toward daily limits
// Users must complete previous day's penalty quests before generating new daily quests
export async function POST() {
  try {
    console.log("POST /api/quests - Generating new quests");
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Declare 'today' only once
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for incomplete penalty quests from previous days
    const { data: oldPenaltyQuests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "penalty")
      .neq("status", "completed")
      .lt("created_at", today.toISOString());

    console.log(
      `Found ${oldPenaltyQuests?.length || 0} incomplete penalty quests from previous days`
    );

    if ((oldPenaltyQuests?.length || 0) > 0) {
      console.log(
        "Blocking quest generation due to incomplete penalty quests from previous days"
      );
      return NextResponse.json(
        {
          error:
            "You must complete all previous day's penalty quests before generating new quests.",
        },
        { status: 400 }
      );
    }

    // Fetch user quest preference
    const { data: userData } = await supabase
      .from("users")
      .select("quest_preference")
      .eq("id", user.id)
      .single();
    const questPreference = userData?.quest_preference || [];

    // Enforce max 9 daily quests per day (rolling window) - EXCLUDE penalty quests
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const { data: todaysQuests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .neq("type", "penalty") // Exclude penalty quests from daily limit
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    console.log(
      `Found ${todaysQuests?.length || 0} daily quests today (excluding penalty quests)`
    );

    if ((todaysQuests?.length || 0) >= 9) {
      return NextResponse.json(
        { error: "You have reached the daily quest limit (9)." },
        { status: 400 }
      );
    }

    // Always generate 3 quests per set
    const generatedQuests = (await generateQuests(questPreference)).slice(0, 3);
    const remaining = 9 - (todaysQuests?.length || 0);

    console.log(
      `Generated ${generatedQuests.length} quests, remaining slots: ${remaining}`
    );

    if (remaining <= 0) {
      console.log("No remaining slots for new quests today");
      return NextResponse.json(
        { error: "No more quests can be generated today." },
        { status: 400 }
      );
    }
    const questsToInsert = generatedQuests.slice(0, Math.min(3, remaining));

    console.log(
      `Will insert ${questsToInsert.length} quests out of ${generatedQuests.length} generated`
    );

    if (questsToInsert.length === 0) {
      console.log("No quests to insert after filtering");
      return NextResponse.json(
        { error: "No more quests can be generated today." },
        { status: 400 }
      );
    }

    // Create a new quest_set
    const { data: questSet, error: questSetError } = await supabase
      .from("quest_sets")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (questSetError || !questSet) {
      console.error("Error creating quest set:", questSetError);
      return NextResponse.json(
        { error: "Failed to create quest set" },
        { status: 500 }
      );
    }

    console.log(`Created quest set with ID: ${questSet.id}`);

    // Insert quests with quest_set_id and rolling 24h deadline
    const now = new Date();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const questsWithSet = questsToInsert.map((quest) => ({
      title: quest.title,
      description: quest.description,
      difficulty: quest.xp > 15 ? "hard" : quest.xp > 10 ? "medium" : "easy",
      xp_reward: quest.xp,
      type: quest.type,
      status: "active",
      user_id: user.id,
      progress: 0,
      deadline: new Date(
        now.getTime() + (quest.deadlineHours || 24) * 60 * 60 * 1000
      ).toISOString(),
      quest_set_id: questSet.id,
      for_date: todayDate.toISOString().split("T")[0],
    }));

    // ✅ Validate quests before inserting
    const validQuests = questsWithSet.filter(
      (q: any) =>
        q.title &&
        q.description &&
        q.type &&
        q.xp_reward &&
        q.deadline
    );

    if (validQuests.length !== questsWithSet.length) {
      console.warn("⚠️ Some quests were invalid and skipped:", questsWithSet);
    }

    if (validQuests.length > 0) {
      const { data: insertedQuests, error: insertError } = await supabase
        .from("quests")
        .insert(validQuests)
        .select();

      if (insertError) {
        console.error("Error inserting quests:", insertError);
        return NextResponse.json(
          { error: "Failed to insert quests" },
          { status: 500 }
        );
      }

      console.log(
        `Inserted ${validQuests.length} valid quests in quest set ${questSet.id}`
      );
      return NextResponse.json({ quests: insertedQuests });
    } else {
      console.error("❌ No valid quests to insert. AI returned invalid JSON.");
      return NextResponse.json(
        { error: "No valid quests to insert." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/quests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
