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
      max_tokens: 500,
      temperature: 0.7,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    // Fallback to a simpler response if the API call fails
    return "I apologize, but I'm having trouble connecting to my AI services right now. Please try again in a moment.";
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

    const { message } = await request.json();

    // Get recent chat history
    const { data: chatHistory } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

    const messages: ChatMsg[] = [
      {
        role: "system",
        content: `You are MuseBot, a friendly and creative AI assistant. Your responses must follow these rules:

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

Example good response to "help me brainstorm meditation ideas":
"Here are three simple meditation ideas to try at home:
1. Morning sunlight meditation: Sit by a window for 5 minutes, focusing on the warmth and light
2. Sound meditation: Use a singing bowl or calming music to guide your breath
3. Walking meditation: Slowly pace in a quiet space, matching your steps to your breath 🌟

Which of these would you like to explore further?"

Example bad response (DO NOT DO THIS):
"Hi! I'm MuseBot, your friendly creativity companion 🌟 I specialize in sparking ideas for writing, meditation, and personal growth. Let's brainstorm some meditation ideas together—what aspect interests you most?"`,
      },
      ...((chatHistory?.reverse().map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) as ChatMsg[]) || []),
      { role: "user", content: message },
    ];

    const response = await callDeepSeekAPI(messages);

    if (!response) {
      throw new Error("No response generated from AI");
    }

    // Clean up response - remove any thinking process or special formatting
    const cleanResponse = response
      .replace(/<think>[\s\S]*?<\/think>/g, "") // Remove thinking process
      .replace(/\*\*[\s\S]*?\*\*/g, "") // Remove bold text
      .replace(/__[\s\S]*?__/g, "") // Remove underlined text
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/^[#*->\s]+/gm, "") // Remove markdown symbols
      .replace(/\n{3,}/g, "\n\n") // Remove excessive newlines
      .trim();

    // Store the conversation
    await supabase.from("chat_messages").insert([
      {
        user_id: user.id,
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      },
      {
        user_id: user.id,
        role: "assistant",
        content: cleanResponse,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ response: cleanResponse });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
