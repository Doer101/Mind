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

    const { content } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid content provided" },
        { status: 400 }
      );
    }

    // Generate feedback using DeepSeek
    const messages = [
      {
        role: "system",
        content: `You are a writing coach. Your feedback must ONLY contain the three feedback sections below. NO other text allowed. Your responses must follow these rules:

1. NEVER include your thinking process, internal monologue, or any text between <think> tags
2. NEVER use markdown formatting or special characters
3. Keep responses concise (2-3 sentences) and natural
4. Use 1-2 emojis maximum, only when appropriate
5. Be encouraging and supportive
6. Focus on creativity, writing, and personal growth
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
- [Focus on plot, character, setting]
- [Be specific and concrete]

Areas for Improvement:
- [2-3 specific suggestions]
- [Focus on actionable changes]
- [Be constructive and specific]

Writing Tips:
- [1-2 actionable tips]
- [Focus on immediate improvements]

Example (copy this exact format):
Strengths:
- Strong opening that immediately establishes setting and character
- Effective use of sensory details (quiet library, heart racing)
- Compelling premise that creates intrigue

Areas for Improvement:
- Consider adding more physical reactions to heighten tension
- The transition from discovery to realization could be more gradual

Writing Tips:
- Try using more varied sentence lengths to create rhythm
- Consider adding a specific detail about the book's appearance`,
      },
      {
        role: "user",
        content: `Provide feedback on this writing: ${content}`,
      },
    ];

    const feedbackRaw = await callDeepSeekAPI(messages);
    // Remove any <think>...</think> blocks and trim whitespace, handle undefined
    const feedback = (feedbackRaw || "")
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();

    if (!feedback) {
      return NextResponse.json(
        { error: "Failed to generate feedback" },
        { status: 500 }
      );
    }

    // Store the feedback
    const { error: insertError } = await supabase
      .from("writing_feedback")
      .insert({
        user_id: user.id,
        content: content,
        feedback: feedback,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error storing feedback:", insertError);
      // Continue even if storage fails - at least return the feedback
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
