import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new InferenceClient(HF_API_KEY);

async function callDeepSeekAPI(messages: any[]) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages: messages,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}

function cleanResponse(text: string | undefined) {
  if (!text) return "No suggestions generated";

  return text
    .replace(/<think>[\s\S]*?<\/think>/g, "") // Remove thinking process
    .replace(/###\s*Enhanced Idea:.*?\n/g, "") // Remove enhanced idea header
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/\*/g, "") // Remove italic markers
    .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
    .replace(/^\s*[-*]\s*/gm, "- ") // Normalize bullet points
    .replace(/^\s*\d+\.\s*/gm, (match) => match.trim() + " ") // Normalize numbered lists
    .trim();
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { idea } = await request.json();

    // Generate AI suggestions for the idea
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant that helps expand and develop ideas. Follow these rules:

1. NEVER include fake dates, names, or news-style formatting
2. NEVER repeat the same content multiple times
3. NEVER generate content that looks like a news article
4. Keep responses practical and implementable
5. Structure your response with clear sections
6. Provide specific, actionable suggestions
7. Include concrete examples
8. Focus on the core idea and its potential
9. Keep the tone professional but friendly
10. Use bullet points or numbered lists for clarity

Format your response like this:
1. Core Concept: [Brief explanation of the main idea]
2. Key Benefits: [List 2-3 main benefits]
3. Implementation Steps: [3-4 specific steps to implement]
4. Potential Challenges: [1-2 challenges and solutions]
5. Next Steps: [2-3 concrete actions to take]

Example good response:
"1. Core Concept: A weekly meal prep system that focuses on balanced, nutritious meals
2. Key Benefits:
   - Saves time during busy weekdays
   - Ensures consistent healthy eating
   - Reduces food waste and saves money
3. Implementation Steps:
   - Set aside 2 hours every Sunday for meal prep
   - Create a rotating menu of 5-7 favorite healthy recipes
   - Invest in quality storage containers
4. Potential Challenges:
   - Initial time investment (Solution: Start with just 2-3 meals)
   - Recipe variety (Solution: Create a recipe bank)
5. Next Steps:
   - Research 3 simple, healthy recipes
   - Make a shopping list
   - Schedule your first meal prep session"`,
      },
      {
        role: "user",
        content: `Enhance this idea: ${idea}`,
      },
    ];

    const suggestions = await callDeepSeekAPI(messages);
    const cleanedSuggestions = cleanResponse(suggestions);

    // Store the idea and suggestions
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      title: idea.substring(0, 100) + "...", // Use first 100 chars as title
      description: cleanedSuggestions,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing idea:", error);
    }

    return NextResponse.json({ suggestions: cleanedSuggestions });
  } catch (error) {
    console.error("Error processing idea:", error);
    return NextResponse.json(
      { error: "Failed to process idea" },
      { status: 500 }
    );
  }
}
