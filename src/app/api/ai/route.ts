import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { InferenceClient } from "@huggingface/inference";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const client = new InferenceClient(HF_API_KEY);

const PEGASUS_API_URL =
  "https://router.huggingface.co/hf-inference/models/google/pegasus-large";

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

async function callPegasusAPI(text: string) {
  try {
    const response = await fetch(PEGASUS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HF_API_KEY}`,
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: 100,
          min_length: 10,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pegasus API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(
        `Pegasus API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].summary_text;
    }
    console.error("Unexpected response format:", data);
    return "I apologize, but I couldn't generate a proper response. Please try again.";
  } catch (error) {
    console.error("Pegasus API Call Failed:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { type, content, context } = await req.json();
    const supabase = await createClient();

    // Verify user authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let response;
    switch (type) {
      case "daily-prompt":
        response = await generateDailyPrompt();
        break;
      case "feedback":
        response = await generateFeedback(content);
        break;
      case "chat":
        response = await handleChat(content, context);
        break;
      case "mirror":
        response = await generateMirror(content);
        break;
      case "idea-expand":
        response = await expandIdea(content);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateDailyPrompt() {
  const messages = [
    {
      role: "system",
      content: `You are a creative writing prompt generator. Generate a daily writing prompt that is:
1. Clear and concise
2. Inspiring and thought-provoking
3. Focused on personal growth or creativity
4. Easy to understand and follow
5. Not too long (max 2-3 sentences)

IMPORTANT: Return ONLY the prompt itself. Do not include:
- Any thinking process or <think> tags
- Any prefixes like "Prompt:" or "Write about:"
- Any explanations or additional text
- Any markdown formatting

Example good response:
"Describe a moment when you felt truly understood by someone else—what words, gestures, or silences bridged the gap between you? Explore how that connection reshaped your perspective."

Example bad response:
<think>We are generating a prompt about understanding...</think>
Prompt: Write about a moment when you felt understood...`,
    },
    {
      role: "user",
      content: "Generate a creative writing prompt.",
    },
  ];

  const prompt = await callDeepSeekAPI(messages);

  // Clean up the prompt
  let cleanPrompt = prompt || "No prompt generated";
  
  cleanPrompt = cleanPrompt.replace(/<think>[\s\S]*?<\/think>/gi, "");
  
  // Handle unclosed <think> tag
  const unclosedThinkIndex = cleanPrompt.toLowerCase().lastIndexOf("<think>");
  if (unclosedThinkIndex !== -1) {
    cleanPrompt = cleanPrompt.slice(0, unclosedThinkIndex);
  }

  cleanPrompt = cleanPrompt
        .replace(/^prompt:?\s*/i, "") // Remove "Prompt:" prefix
        .replace(/^write about:?\s*/i, "") // Remove "Write about:" prefix
        .replace(/^describe:?\s*/i, "") // Remove "Describe:" prefix
        .replace(/^imagine:?\s*/i, "") // Remove "Imagine:" prefix
        .replace(/^think about:?\s*/i, "") // Remove "Think about:" prefix
        .replace(/\n/g, " ") // Remove newlines
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();

  // Save the prompt to the database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("daily_prompts").insert({
      user_id: user.id,
      prompt: cleanPrompt,
      used_at: new Date().toISOString(),
    });
  }

  return {
    prompt: cleanPrompt,
  };
}

async function generateFeedback(content: string) {
  const feedback = await callPegasusAPI(content);
  return {
    feedback: feedback || "No feedback generated",
  };
}

async function handleChat(content: string, context: any[]) {
  const messages = [
    {
      role: "system",
      content:
        "You are MuseBot, a creative and supportive AI assistant. Respond to the user's message in a helpful and encouraging way.",
    },
    ...context,
    {
      role: "user",
      content: content,
    },
  ];

  const response = await callDeepSeekAPI(messages);
  return {
    response: response || "No response generated",
  };
}

async function generateMirror(content: string) {
  const reflection = await callPegasusAPI(content);
  return {
    reflection: reflection || "No reflection generated",
  };
}

async function expandIdea(content: string) {
  const messages = [
    {
      role: "system",
      content:
        "Take this idea and suggest related concepts, potential directions, and next steps. Be imaginative but practical.",
    },
    {
      role: "user",
      content: content,
    },
  ];

  const expansion = await callDeepSeekAPI(messages);
  return {
    expansion: expansion || "No expansion generated",
  };
}
