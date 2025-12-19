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
    return chatCompletion.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}

// === FALLBACKS ===
function getFallbackQuests(): Quest[] {
  return [
    {
      title: "Creative Challenge",
      description: "Create something new using your favorite tools or medium.",
      type: "creative",
      xp: 15,
      deadlineHours: 24,
    },
    {
      title: "Reflect and Write",
      description: "Take 10 minutes to journal about your recent progress.",
      type: "journal",
      xp: 10,
      deadlineHours: 24,
    },
    {
      title: "Learn Something New",
      description: "Spend time learning a new skill or concept today.",
      type: "challenge",
      xp: 15,
      deadlineHours: 24,
    },
  ];
}

type Quest = {
  title: string;
  description: string;
  type: "creative" | "journal" | "mindset" | "reflection" | "challenge";
  xp: number;
  deadlineHours: number;
};

const VALID_QUEST_TYPES = ["creative", "journal", "mindset", "reflection", "challenge"] as const;

// --- Small helpers ---
function stripThinkTags(s: string): string {
  return (s || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function extractJsonArraySlice(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  // Find the start of a JSON array containing an object
  const startIndex = raw.search(/\[\s*\{/);
  if (startIndex === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIndex; i < raw.length; i++) {
    const char = raw[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\") {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === "[") depth++;
      else if (char === "]") depth--;

      if (depth === 0) {
        return raw.slice(startIndex, i + 1);
      }
    }
  }

  // If we reach here, we found the start but not the end (truncated).
  // Return what we have, though it will likely fail parsing.
  return raw.slice(startIndex);
}

function sanitizeJsonish(s: string): string {
  return (s || "")
    .replace(/^\uFEFF/, "")           // remove BOM
    .replace(/&quot;/g, '"')          // common HTML escapes
    .replace(/&amp;/g, "&")
    .replace(/,\s*([}\]])/g, "$1")    // trailing commas
    .replace(/(\{|,)\s*([a-zA-Z_][\w-]*)\s*:/g, '$1"$2":') // quote bare keys
    .replace(/:\s*([a-zA-Z_][\w-]*)\s*([,}\]])/g, ':"$1"$2') // bare string values
    .replace(/[\u0000-\u0019]+/g, ""); // remove control chars
}

// Extract top-level {...} objects by counting braces
function extractTopLevelObjects(s: string): string[] {
  const objs: string[] = [];
  if (!s) return objs;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && start !== -1) {
        objs.push(s.slice(start, i + 1));
        start = -1;
      }
    }
  }
  return objs;
}

// Lenient fallback extractor that searches for quoted "title"/"description" pairs
function extractQuestsFromRawResponse(response: string): Quest[] {
  const quests: Quest[] = [];
  if (!response) return quests;

  const titlePattern = /"title"\s*:\s*"([^"]*?)"/g;
  const descriptionPattern = /"description"\s*:\s*"([^"]*?)"/g;
  const typePattern = /"type"\s*:\s*"([^"]*?)"/g;
  const xpPattern = /"xp"\s*:\s*(\d+)/g;
  const deadlinePattern = /"deadlineHours"\s*:\s*(\d+)/g;

  const titles: string[] = [];
  let m;
  while ((m = titlePattern.exec(response)) !== null) titles.push(m[1]);

  const descriptions: string[] = [];
  while ((m = descriptionPattern.exec(response)) !== null) descriptions.push(m[1]);

  const types: string[] = [];
  while ((m = typePattern.exec(response)) !== null) types.push(m[1]);

  const xps: number[] = [];
  while ((m = xpPattern.exec(response)) !== null) xps.push(parseInt(m[1], 10));

  const deadlines: number[] = [];
  while ((m = deadlinePattern.exec(response)) !== null) deadlines.push(parseInt(m[1], 10));

  const max = Math.max(titles.length, descriptions.length, types.length, xps.length, deadlines.length);

  for (let i = 0; i < max; i++) {
    if (!titles[i] || !descriptions[i]) continue;
    let type = (types[i] || "challenge").toLowerCase();
    if (!VALID_QUEST_TYPES.includes(type as any)) type = "challenge";
    quests.push({
      title: titles[i].trim(),
      description: descriptions[i].trim(),
      type: type as Quest["type"],
      xp: xps[i] || 10,
      deadlineHours: deadlines[i] || 24,
    });
  }

  // line-based lax extraction (very last resort)
  if (quests.length === 0) {
    const lines = response.split(/\r?\n/);
    for (const line of lines) {
      const t = line.match(/title.*?:\s*["']?([^"']{5,80})["']?/i);
      const d = line.match(/description.*?:\s*["']?([^"']{5,160})["']?/i);
      if (t && d) {
        quests.push({
          title: t[1].trim(),
          description: d[1].trim(),
          type: "challenge",
          xp: 10,
          deadlineHours: 24,
        });
      }
    }
  }

  return quests;
}

// --- The self-contained tryParseQuestArray function ---
function tryParseQuestArray(raw: string): Quest[] | null {
  if (!raw || typeof raw !== "string") return null;

  const cleaned = stripThinkTags(raw);
  const slice = extractJsonArraySlice(cleaned);

  const normalize = (q: any): Quest | null => {
    if (!q || typeof q !== "object") return null;
    const title = typeof q.title === "string" ? q.title.trim() : null;
    const description = typeof q.description === "string" ? q.description.trim() : null;
    const typeRaw = q.type != null ? String(q.type).toLowerCase() : null;
    const type: any = VALID_QUEST_TYPES.includes(typeRaw as any) ? (typeRaw as Quest["type"]) : "challenge";
    const xp = Number.isFinite(Number(q.xp)) ? Math.max(1, Math.min(20, Number(q.xp))) : 10;
    const deadlineHours = Number.isFinite(Number(q.deadlineHours)) ? Math.max(1, Number(q.deadlineHours)) : 24;
    if (!title || !description) return null;
    return { title, description, type, xp, deadlineHours } as Quest;
  };

  // 1) Try strict parse of the whole array slice
  if (slice) {
    try {
      const strict = sanitizeJsonish(slice);
      const parsed = JSON.parse(strict);
      if (Array.isArray(parsed)) {
        const normalized = parsed.map(normalize).filter(Boolean) as Quest[];
        if (normalized.length > 0) return normalized;
      }
    } catch (err) {
      console.warn("tryParseQuestArray strict parse failed, falling back to object extraction:", err);
    }
  }

  // 2) Object extraction fallback
  const objectsSource = slice || cleaned;
  const rawObjects = extractTopLevelObjects(objectsSource);

  const parsedObjects: Quest[] = [];
  for (const objStr of rawObjects) {
    try {
      const objSanitized = sanitizeJsonish(objStr);
      const parsed = JSON.parse(objSanitized);
      const normalized = normalize(parsed);
      if (normalized) parsedObjects.push(normalized);
    } catch (err) {
      // second-pass lenient attempt
      try {
        const lastClose = objStr.lastIndexOf("}");
        const trimmed = lastClose !== -1 ? objStr.slice(0, lastClose + 1) : objStr;
        const moreSanitized = sanitizeJsonish(trimmed);
        const reparsed = JSON.parse(moreSanitized);
        const normalized = normalize(reparsed);
        if (normalized) parsedObjects.push(normalized);
      } catch (innerErr) {
        console.warn("Skipping a malformed object during extraction fallback:", innerErr);
      }
    }
  }

  if (parsedObjects.length > 0) return parsedObjects;

  // 3) Gentle regex-based fallback
  const extractedLenient = extractQuestsFromRawResponse(cleaned);
  if (extractedLenient && extractedLenient.length > 0) return extractedLenient;

  return null;
}


// === AI-DRIVEN QUEST GENERATION ===
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
    console.log(
      "AI Response Preview:",
      response ? response.substring(0, 200) + (response.length > 200 ? "..." : "") : "No response"
    );

    if (!response) {
      throw new Error("Empty AI response received.");
    }

    const parsed = tryParseQuestArray(response);
    if (parsed && parsed.length > 0) {
      // Ensure we return exactly 3 as requested (or fewer if AI returned less)
      const result = parsed.slice(0, 3);
      // final normalization guard
      return result.map((q) => ({
        title: q.title,
        description: q.description,
        type: q.type,
        xp: Math.max(1, Math.min(20, Math.round(q.xp))),
        deadlineHours: Math.max(1, Math.round(q.deadlineHours)),
      }));
    }

    // fallback: attempt lenient extraction
    const extracted = extractQuestsFromRawResponse(stripThinkTags(response));
    if (extracted && extracted.length > 0) {
      return extracted.slice(0, 3);
    }

    // fallback to hard-coded list
    console.warn("Using fallback quests due to parsing error");
    return getFallbackQuests().slice(0, 3);
  } catch (error) {
    console.error("Error generating quests:", error);
    // final fallback
    return getFallbackQuests().slice(0, 3);
  }
}

// === HELPER TO BUILD DISTINCT PENALTY FROM MISSED QUEST ===
function buildDistinctPenaltyFromMissed(expired: any): { title: string; description: string; xp: number; deadlineHours: number } {
  const baseTitle = (expired?.title || "Missed Quest").toString().trim();
  const baseDesc = (expired?.description || "Complete the missed quest.").toString().trim();

  return {
    title: `Make-up Sprint: ${baseTitle}`,
    description: `Do a focused version: ${baseDesc} — 20-minute timer, finish one task.`,
    xp: 8,
    deadlineHours: 24,
  };
}

// === GET (fetch or create quests if missing) ===
export async function GET(req: Request) {
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

    // Check for sub_module_id in query params
    const { searchParams } = new URL(req.url);
    const subModuleId = searchParams.get("sub_module_id");

    // Fetch active daily quests for the user
    let query = supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (subModuleId) {
      query = query.eq("sub_module_id", subModuleId);
    }

    const { data: quests, error: questError } = await query.order("created_at", { ascending: false });

    if (questError) {
      console.error("Error fetching quests:", questError);
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
    }

    // Separate daily and penalty quests
    const dailyQuests = (quests || []).filter((q: any) => q.type !== "penalty");
    const penaltyQuests = (quests || []).filter((q: any) => q.type === "penalty");

    // Check for expired, incomplete daily quests (deadline < now, not completed)
    const now = new Date();
    console.log("Current time:", now.toISOString());

    const expiredQuests = dailyQuests.filter((q: any) => {
      try {
        const deadline = new Date(q.deadline);
        const isExpired = deadline < now;
        const isNotCompleted = q.status !== "completed";
        console.log(`Quest ${q.id}: deadline=${deadline.toISOString()}, expired=${isExpired}, completed=${!isNotCompleted}`);
        return isExpired && isNotCompleted;
      } catch {
        return false;
      }
    });

    console.log(`Found ${expiredQuests.length} expired quests`);

    // For each expired, incomplete quest, generate a penalty quest if not already present
    for (const expired of expiredQuests) {
      const alreadyHasPenalty = penaltyQuests.some((pq: any) => pq.penalty_for_quest_id === expired.id);
      console.log(`Quest ${expired.id} already has penalty: ${alreadyHasPenalty}`);

      if (alreadyHasPenalty) continue;

      // 1. Move the missed quest to penalty type and mark as moved
      try {
        const { error: moveError } = await supabase
          .from("quests")
          .update({ type: "penalty", status: "moved-to-penalty" })
          .eq("id", expired.id)
          .eq("user_id", user.id);
        if (moveError) {
          console.error("Error moving missed quest to penalty type:", moveError);
          // do not abort — we still attempt to create penalty to avoid leaving user stuck
        } else {
          console.log(`Moved quest ${expired.id} to penalty type.`);
        }
      } catch (e) {
        console.error("Unexpected error moving quest to penalty:", e);
      }

      // 2. Generate a new penalty quest using AI (use robust parse and ensure distinctness)
      let penalty = buildDistinctPenaltyFromMissed(expired);

      try {
        const penaltyPrompt = [
          { role: "system", content: QUEST_GENERATION_RULES },
          {
            role: "user",
            content: `Generate 1 penalty quest for: '${expired.title}' - ${expired.description}. Make it challenging. Output ONLY JSON array.`,
          },
        ];

        const aiResponse = await callDeepSeekAPI(penaltyPrompt);
        console.log("Penalty AI Response Preview:", aiResponse ? aiResponse.substring(0, 200) : "No response");

        if (aiResponse) {
          const parsed = tryParseQuestArray(aiResponse);
          if (parsed && parsed.length > 0) {
            const q = parsed[0];
            penalty = {
              title: q.title || penalty.title,
              description: q.description || penalty.description,
              xp: q.xp || penalty.xp,
              deadlineHours: q.deadlineHours || penalty.deadlineHours,
            };

            // Ensure it's not textually identical to the moved quest
            const sameTitle = (penalty.title || "").trim() === (expired.title || "").toString().trim();
            const sameDesc = (penalty.description || "").trim() === (expired.description || "").toString().trim();
            if (sameTitle || sameDesc) {
              const distinct = buildDistinctPenaltyFromMissed(expired);
              if (sameTitle) penalty.title = distinct.title;
              if (sameDesc) penalty.description = distinct.description;
            }
          } else {
            // fallback extract
            const extracted = extractQuestsFromRawResponse(stripThinkTags(aiResponse));
            if (extracted.length > 0) {
              const q = extracted[0];
              penalty = {
                title: q.title || penalty.title,
                description: q.description || penalty.description,
                xp: q.xp || penalty.xp,
                deadlineHours: q.deadlineHours || penalty.deadlineHours,
              };
            } else {
              console.warn("Penalty AI parse failed; using distinct fallback.");
            }
          }
        } else {
          console.warn("Empty AI response for penalty quest; using distinct fallback.");
        }
      } catch (err) {
        console.error("AI penalty quest generation failed; using distinct fallback.", err);
      }

      // 2.a Idempotency guard: avoid inserting near-identical penalty for same expired.id
      try {
        const { data: existingSimilar } = await supabase
          .from("quests")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", "penalty")
          .eq("penalty_for_quest_id", expired.id)
          .eq("title", penalty.title)
          .eq("description", penalty.description)
          .limit(1);

        if (existingSimilar && existingSimilar.length > 0) {
          console.log("Similar penalty already exists; skipping insert.");
        } else {
          // Compose deadline ISO
          const penaltyDeadlineISO = new Date(now.getTime() + (penalty.deadlineHours || 24) * 60 * 60 * 1000).toISOString();

          const { data: penaltyQuest, error: penaltyError } = await supabase
            .from("quests")
            .insert({
              title: penalty.title,
              description: penalty.description,
              difficulty: penalty.xp > 15 ? "hard" : penalty.xp > 10 ? "medium" : "easy",
              xp_reward: penalty.xp,
              type: "penalty",
              status: "active",
              user_id: user.id,
              progress: 0,
              deadline: penaltyDeadlineISO,
              penalty_for_quest_id: expired.id,
              for_date: expired.for_date || (expired.created_at ? expired.created_at.split("T")[0] : new Date().toISOString().split("T")[0]),
              quest_set_id: null,
            })
            .select();

          if (penaltyError) {
            console.error("Error creating penalty quest:", penaltyError);
          } else {
            console.log("Successfully created penalty quest:", penaltyQuest);
          }
        }
      } catch (err) {
        console.error("Error while inserting penalty quest (idempotency guard or insert):", err);
      }

      // 3. Deduct 20 XP from the user (best-effort)
      try {
        const { error: xpError } = await supabase.rpc("increment_user_xp", {
          uid: user.id,
          xp_amount: -20,
        });
        if (xpError) {
          console.error("Error deducting XP for missed quest:", xpError);
        } else {
          console.log("Deducted 20 XP from user for missed quest.");
        }
      } catch (err) {
        console.error("RPC increment_user_xp failed:", err);
      }
    }

    // Re-fetch penalty quests in case new ones were added
    const { data: updatedPenaltyQuests, error: penaltyFetchError } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "penalty")
      .in("status", ["active", "moved-to-penalty"]);

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

    // Declare 'today' only once (start of day)
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

    console.log(`Found ${oldPenaltyQuests?.length || 0} incomplete penalty quests from previous days`);

    if ((oldPenaltyQuests?.length || 0) > 0) {
      console.log("Blocking quest generation due to incomplete penalty quests from previous days");
      return NextResponse.json(
        {
          error: "You must complete all previous day's penalty quests before generating new quests.",
        },
        { status: 400 }
      );
    }

    // Fetch user quest preference
    const { data: userData } = await supabase.from("users").select("quest_preference").eq("id", user.id).single();
    const questPreference = userData?.quest_preference || [];

    // Enforce max 9 daily quests per day (rolling window) - EXCLUDE penalty quests
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const { data: todaysQuests } = await supabase
      .from("quests")
      .select("*")
      .eq("user_id", user.id)
      .neq("type", "penalty")
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    console.log(`Found ${todaysQuests?.length || 0} daily quests today (excluding penalty quests)`);

    if ((todaysQuests?.length || 0) >= 9) {
      return NextResponse.json({ error: "You have reached the daily quest limit (9)." }, { status: 400 });
    }

    // Always generate 3 quests per set
    const generatedQuests = (await generateQuests(questPreference)).slice(0, 3);
    const remaining = 9 - (todaysQuests?.length || 0);

    console.log(`Generated ${generatedQuests.length} quests, remaining slots: ${remaining}`);

    if (remaining <= 0) {
      console.log("No remaining slots for new quests today");
      return NextResponse.json({ error: "No more quests can be generated today." }, { status: 400 });
    }
    const questsToInsert = generatedQuests.slice(0, Math.min(3, remaining));

    console.log(`Will insert ${questsToInsert.length} quests out of ${generatedQuests.length} generated`);

    if (questsToInsert.length === 0) {
      console.log("No quests to insert after filtering");
      return NextResponse.json({ error: "No more quests can be generated today." }, { status: 400 });
    }

    // Create a new quest_set
    const { data: questSet, error: questSetError } = await supabase.from("quest_sets").insert({ user_id: user.id }).select().single();
    if (questSetError || !questSet) {
      console.error("Error creating quest set:", questSetError);
      return NextResponse.json({ error: "Failed to create quest set" }, { status: 500 });
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
      xp_reward: Math.max(1, Math.min(20, Math.round(quest.xp))),
      type: quest.type,
      status: "active",
      user_id: user.id,
      progress: 0,
      deadline: new Date(now.getTime() + (quest.deadlineHours || 24) * 60 * 60 * 1000).toISOString(),
      quest_set_id: questSet.id,
      for_date: todayDate.toISOString().split("T")[0],
    }));

    // Validate quests before inserting
    const validQuests = questsWithSet.filter(
      (q: any) => q.title && q.description && q.type && q.xp_reward && q.deadline
    );

    if (validQuests.length !== questsWithSet.length) {
      console.warn("⚠️ Some quests were invalid and skipped:", questsWithSet);
    }

    if (validQuests.length > 0) {
      const { data: insertedQuests, error: insertError } = await supabase.from("quests").insert(validQuests).select();

      if (insertError) {
        console.error("Error inserting quests:", insertError);
        return NextResponse.json({ error: "Failed to insert quests" }, { status: 500 });
      }

      console.log(`Inserted ${validQuests.length} valid quests in quest set ${questSet.id}`);
      return NextResponse.json({ quests: insertedQuests });
    } else {
      console.error("❌ No valid quests to insert. AI returned invalid JSON.");
      return NextResponse.json({ error: "No valid quests to insert." }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/quests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
