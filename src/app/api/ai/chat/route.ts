import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

const DEEPSEEK_API_URL = "https://ollama.discuza.in/api/generate";
const DEEPSEEK_AUTH =
  "Basic " +
  Buffer.from(
    `${process.env.DEESEEK_USERNAME}:${process.env.DEESEEK_PASSWORD}`
  ).toString("base64");

async function callDeepSeekAPI(messages: any[]) {
  try {
    const systemPrompt =
      messages.find((msg) => msg.role === "system")?.content || "";
    const userMessage = messages[messages.length - 1]?.content || "";

    const body = {
      model: "deepseek-r1",
      prompt: `${systemPrompt}\nUser: ${userMessage}`,
      stream: true,
    };

    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        Authorization: DEEPSEEK_AUTH,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API returned ${res.status}:\n${errorText}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("No stream reader available");
    }

    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let result = "";

    // ✅ Improved stream reader with buffer
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.lastIndexOf("\n");
      if (boundary === -1) continue; // Wait for more data

      const lines = buffer.slice(0, boundary).split("\n");
      buffer = buffer.slice(boundary + 1); // Save leftover

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          result += parsed.response || "";
        } catch (err) {
          console.warn("Skipping invalid JSON chunk:", trimmed);
        }
      }
    }

    return result.trim();
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
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

    // 🔄 Fetch chat history
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
15. Give concrete examples when relevant`,
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

    const cleanResponse = response
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/\*\*[\s\S]*?\*\*/g, "")
      .replace(/__[\s\S]*?__/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^[#*->\s]+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

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
