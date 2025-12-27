import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new InferenceClient(HF_API_KEY);

// Rate limiting: max messages per day
const MAX_MESSAGES_PER_DAY = 20;

async function callDeepSeekAPI(messages: any[]) {
  try {
    const chatCompletion = await client.chatCompletion({
      provider: "hyperbolic",
      model: "deepseek-ai/DeepSeek-R1-0528",
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("DeepSeek API Call Failed:", error);
    throw error;
  }
}

// Helper function to parse date from AI response
function parseTodoDate(dateStr: string): string {
  const today = new Date();
  
  if (dateStr === "TODAY") {
    return today.toISOString().split('T')[0];
  }
  
  if (dateStr === "TOMORROW") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Default to today if parsing fails
  return today.toISOString().split('T')[0];
}

// Helper function to create a todo
async function createTodoFromChat(
  supabase: any,
  userId: string,
  date: string,
  text: string
) {
  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: userId,
      date: date,
      text: text,
      color: "#3b82f6", // Default blue color
      completed: false,
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
  
  return data;
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

    // Rate limiting: Check message count for today
    // Count by checking how many rows exist (each row = 1 user message + 1 AI response)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data: todaysMessages, error: countError } = await supabase
      .from("chat_messages")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString());

    if (countError) {
      console.error("Error checking message count:", countError);
    }

    const messageCount = todaysMessages?.length || 0;
    if (messageCount >= MAX_MESSAGES_PER_DAY) {
      return NextResponse.json(
        { error: `Daily chat limit reached. You can send up to ${MAX_MESSAGES_PER_DAY} messages per day.` },
        { status: 429 }
      );
    }

    const { message } = await request.json();

    // 🔄 Fetch chat history (last 5 conversations)
    const { data: chatHistory } = await supabase
      .from("chat_messages")
      .select("content, response")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

    // Build messages array with system prompt, history, and current message
    const messages: ChatMsg[] = [
      {
        role: "system",
        content: `You are MuseBot, a friendly AI assistant.

RULE #1: NEVER show thinking process or <think> tags in your response!

For normal chat: Keep responses concise (2-3 sentences), friendly, and supportive.

For TODO CREATION:
If user asks to create a todo/task/reminder, respond ONLY with:
TODO_CREATE|DATE|exact task from user

Date rules (today: ${new Date().toISOString().split('T')[0]}):
- tomorrow → TOMORROW
- specific date → YYYY-MM-DD format
- no date → TODAY

Examples:
"create todo tomorrow call kushal" → TODO_CREATE|TOMORROW|call kushal
"remind me dec 12 to meet john" → TODO_CREATE|2025-12-12|meet john
"add task finish report" → TODO_CREATE|TODAY|finish report

IMPORTANT: Use the EXACT task words from user, not "task description"!`,
      },
    ];

    // Add chat history (reverse to get chronological order)
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.reverse().forEach((msg: any) => {
        if (msg.content) {
          messages.push({ role: "user", content: msg.content });
        }
        if (msg.response) {
          messages.push({ role: "assistant", content: msg.response });
        }
      });
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    const response = await callDeepSeekAPI(messages);

    if (!response) {
      throw new Error("No response generated from AI");
    }



    // Check if response contains todo creation intent
    let finalResponse = response;
    let todoCreated = false;
    
    if (response.includes("TODO_CREATE|")) {
      try {
        // Parse the TODO_CREATE format: TODO_CREATE|DATE|DESCRIPTION
        const todoMatch = response.match(/TODO_CREATE\|([^|]+)\|(.+)/);
        

        
        if (todoMatch) {
          const [, dateStr, description] = todoMatch;
          const parsedDate = parseTodoDate(dateStr.trim());
          const todoText = description.trim();
          

          
          // Create the todo
          const todo = await createTodoFromChat(
            supabase,
            user.id,
            parsedDate,
            todoText
          );
          
          todoCreated = true;
          
          // Update response to confirmation message
          finalResponse = `✅ I've created a todo for ${parsedDate}: "${todoText}"`;
          

        }
      } catch (todoError) {
        console.error("Error creating todo:", todoError);
        finalResponse = "I understood you want to create a todo, but I encountered an error. Please try again or create it manually.";
      }
    }

    let cleanResponse = finalResponse.replace(/<think>[\s\S]*?<\/think>/gi, "");
    
    // Handle unclosed <think> tag
    const unclosedThinkIndex = cleanResponse.toLowerCase().lastIndexOf("<think>");
    if (unclosedThinkIndex !== -1) {
      cleanResponse = cleanResponse.slice(0, unclosedThinkIndex);
    }

    cleanResponse = cleanResponse
      .replace(/\*\*[\s\S]*?\*\*/g, "")
      .replace(/__[\s\S]*?__/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/^[#*->\s]+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();



    // Store in database with content (user message) and response (AI reply)
    const { data: insertedData, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        user_id: user.id,
        content: message,
        response: cleanResponse,
        created_at: new Date().toISOString(),
      })
      .select();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to save message: ${insertError.message}`);
    }



    return NextResponse.json({ response: cleanResponse });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
