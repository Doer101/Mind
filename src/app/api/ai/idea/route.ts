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
        content:
          "Take this idea and suggest related concepts, potential directions, and next steps. Be imaginative but practical.",
      },
      {
        role: "user",
        content: `Enhance this idea: ${idea}`,
      },
    ];

    const suggestions = await callDeepSeekAPI(messages);

    // Store the idea and suggestions
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      idea: idea,
      suggestions: suggestions,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing idea:", error);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error processing idea:", error);
    return NextResponse.json(
      { error: "Failed to process idea" },
      { status: 500 }
    );
  }
}
