import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new InferenceClient(HF_API_KEY);

async function callDeepSeekAPI(text: string) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages: [
        {
          role: "system",
          content: `You are a creative writing coach. Provide a thoughtful reflection on the user's writing or idea. Your response must:

1. Be ONLY the reflection text - no thinking process, no <think> tags, no analysis
2. Be concise (2-3 sentences)
3. Offer creative insights and suggestions
4. Be encouraging and supportive
5. NOT include any copyright notices, source links, or meta-text
6. NOT start with "Your Reflection:" or similar prefixes
7. NOT include any markdown formatting (no *, _, etc.)
8. NOT include any thinking process or internal monologue
9. Be written in a warm, friendly tone
10. Start directly with your response

Example good response:
"Consider organizing your books by color for a visually striking display, or by genre and then alphabetically for easy access. You could also create themed sections based on your reading interests."

Example bad response (DO NOT DO THIS):
"<think>Analyzing the user's request...</think>
Your Reflection:
*Try* organizing books by _color_ for a beautiful display!"`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
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

    const { content } = await request.json();

    // Generate reflection using DeepSeek
    const reflectionRaw = await callDeepSeekAPI(content);

    // Remove any <think>...</think> blocks and trim whitespace, handle undefined
    const reflection = (reflectionRaw || "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    if (!reflection) {
      return NextResponse.json(
        { error: "Failed to generate reflection" },
        { status: 500 }
      );
    }

    // Check if a reflection for this content already exists
    const { data: existingReflection } = await supabase
      .from("creativity_mirror")
      .select("id")
      .eq("user_id", user.id)
      .eq("content", content)
      .single();

    // Only insert if no reflection exists for this content
    if (!existingReflection) {
      const { error } = await supabase.from("creativity_mirror").insert({
        user_id: user.id,
        content: content,
        reflection: reflection,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error storing reflection:", error);
      }
    }

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Error processing reflection:", error);
    return NextResponse.json(
      { error: "Failed to process reflection" },
      { status: 500 }
    );
  }
}
