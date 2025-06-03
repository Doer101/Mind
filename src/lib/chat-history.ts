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
    .select("role, content")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }

  return data || [];
}

export async function saveChatMessage(
  userId: string,
  message: ChatMessage
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("chat_messages").insert({
    user_id: userId,
    role: message.role,
    content: message.content,
  });

  if (error) {
    console.error("Error saving chat message:", error);
    throw error;
  }
}
