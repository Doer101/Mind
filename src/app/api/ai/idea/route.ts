import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a creative idea enhancer. Analyze the given idea and provide: 1) Potential variations or twists, 2) Related concepts to explore, 3) Practical next steps. Keep suggestions concise and actionable.",
        },
        {
          role: "user",
          content: `Enhance this idea: ${idea}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const suggestions = completion.choices[0].message?.content;

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
