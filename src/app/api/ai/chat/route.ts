import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/client";

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
          "You are MuseBot, a creative and supportive AI assistant focused on mindfulness, creativity, and personal growth. Provide thoughtful, encouraging responses that help users explore their ideas and feelings.",
      },
      ...((chatHistory?.reverse().map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })) as ChatMsg[]) || []),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message?.content;

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
