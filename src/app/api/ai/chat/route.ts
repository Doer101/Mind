import { NextResponse } from "next/server";
import { createClient } from "@/supabase/client";
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
        content:
          "You are MuseBot, a creative and supportive AI assistant. Respond to the user's message in a helpful and encouraging way.",
      },
      ...((chatHistory?.reverse().map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) as ChatMsg[]) || []),
      { role: "user", content: message },
    ];

    const response = await callDeepSeekAPI(messages);

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
        content: response,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
