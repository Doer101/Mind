import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a creative prompt generator for writers. Generate an inspiring and thought-provoking writing prompt that encourages self-reflection and creativity.",
      },
      {
        role: "user",
        content:
          "Give me a creative writing prompt about self-discovery and personal growth.",
      },
    ],
  });

  return {
    prompt: completion.choices[0]?.message?.content || "No prompt generated",
  };
}

async function generateFeedback(content: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a writing coach. Provide constructive feedback on the user's writing, focusing on style, clarity, and tone. Be encouraging and specific.",
      },
      {
        role: "user",
        content: content,
      },
    ],
  });

  return {
    feedback:
      completion.choices[0]?.message?.content || "No feedback generated",
  };
}

async function handleChat(content: string, context: any[]) {
  const messages = [
    {
      role: "system",
      content:
        "You are MuseBot, a creative and supportive AI assistant focused on helping users with their creative journey, mindfulness, and personal growth. Be encouraging, insightful, and slightly playful in your responses.",
    },
    ...context,
    {
      role: "user",
      content: content,
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
  });

  return {
    response:
      completion.choices[0]?.message?.content || "No response generated",
  };
}

async function generateMirror(content: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a mindfulness and creativity coach. Analyze the user's journal entry and provide insights about their current state, mood, and creative potential. Offer gentle suggestions for growth.",
      },
      {
        role: "user",
        content: content,
      },
    ],
  });

  return {
    reflection:
      completion.choices[0]?.message?.content || "No reflection generated",
  };
}

async function expandIdea(content: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a creative brainstorming partner. Take the user's idea and suggest related concepts, potential directions, and next steps. Be imaginative but practical.",
      },
      {
        role: "user",
        content: content,
      },
    ],
  });

  return {
    expansion:
      completion.choices[0]?.message?.content || "No expansion generated",
  };
}
