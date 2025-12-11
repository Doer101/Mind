import { createClient } from "@/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getChatHistory(
  userId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("content, response")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  // Convert database format to ChatMessage format
  const messages: ChatMessage[] = [];
  (data || []).reverse().forEach((msg: any) => {
    if (msg.content) {
      messages.push({ role: "user", content: msg.content });
    }
    if (msg.response) {
      messages.push({ role: "assistant", content: msg.response });
    }
  });

  return messages;
}

export async function saveChatMessage(
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("chat_messages").insert({
    user_id: userId,
    content: userMessage,
    response: aiResponse,
  });

  if (error) {
    throw error;
  }
}
