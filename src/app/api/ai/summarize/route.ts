import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new InferenceClient(HF_API_KEY);

// Updated system prompt with stronger instruction
const SUMMARIZATION_RULES = `ONLY RETURN THE FINAL FEEDBACK. DO NOT include thinking, reasoning, or any <think> tags.

You are a summarization coach. Your feedback must ONLY contain the three feedback sections below. NO other text allowed. Your responses must follow these rules:

1. NEVER include your thinking process, internal monologue, or any text between <think> tags
2. NEVER use markdown formatting or special characters
3. Keep responses concise (2-3 sentences) and natural
4. Use 1-2 emojis maximum, only when appropriate
5. Be encouraging and supportive
6. Focus on clarity, accuracy, and summarization quality
7. Start directly with your response, no prefixes or thinking markers
8. Keep the tone warm and friendly
9. Don't use multiple exclamation marks
10. Don't include any meta-commentary about your response
11. Don't repeat your introduction in every message
12. Provide specific, actionable advice when asked
13. Stay focused on the user's current topic
14. Don't ask too many questions in one response
15. Give concrete examples when relevant

FORMAT:
Strengths:
- [2-3 specific things done well]
- [Focus on clarity, relevance, and accuracy]
- [Be specific and concrete]

Areas for Improvement:
- [2-3 specific suggestions]
- [Focus on actionable changes]
- [Be constructive and specific]

Summarization Tips:
- [1-2 actionable tips]
- [Focus on immediate improvements]`;

async function callDeepSeekAPI(content: string) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages: [
        {
          role: "system",
          content: SUMMARIZATION_RULES,
        },
        {
          role: "user",
          content: `Provide feedback on this writing: ${content}`,
        },
      ],
      parameters: {
        max_length: 300,
        min_length: 100,
        temperature: 0.7,
        top_p: 0.95,
        do_sample: true,
      },
    });

    const rawOutput = chatCompletion?.choices?.[0]?.message?.content;
    if (!rawOutput) {
      throw new Error("No valid response from DeepSeek API");
    }

    // ✅ Extract only the last full valid response block
    const lastStrengthsIndex = rawOutput.lastIndexOf("Strengths:");
    const lastAreasIndex = rawOutput.lastIndexOf("Areas for Improvement:");
    const lastTipsIndex = rawOutput.lastIndexOf("Summarization Tips:");

    if (
      lastStrengthsIndex === -1 ||
      lastAreasIndex === -1 ||
      lastTipsIndex === -1
    ) {
      throw new Error("Invalid format returned from model.");
    }

    const cleanResponse = rawOutput.slice(lastStrengthsIndex).trim();

    return cleanResponse;
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

    const summary = await callDeepSeekAPI(content);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error processing journal summary:", error);
    return NextResponse.json(
      { error: "Failed to process journal summary" },
      { status: 500 }
    );
  }
}
