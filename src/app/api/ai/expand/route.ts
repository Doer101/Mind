import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const PEGASUS_API_URL =
  "https://router.huggingface.co/hf-inference/models/google/pegasus-large";

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
          max_length: 250,
          min_length: 100,
          temperature: 0.8,
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
    return "I apologize, but I couldn't expand your idea. Please try again.";
  } catch (error) {
    console.error("Pegasus API Call Failed:", error);
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

    // Generate expansion using Pegasus
    const expansion = await callPegasusAPI(content);

    // Store the expansion in the ideas table
    const { error } = await supabase.from("ideas").insert({
      user_id: user.id,
      title: content.substring(0, 100) + "...", // Use first 100 chars as title
      description: expansion,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing idea:", error);
    }

    return NextResponse.json({ expansion });
  } catch (error) {
    console.error("Error processing idea expansion:", error);
    return NextResponse.json(
      { error: "Failed to process idea expansion" },
      { status: 500 }
    );
  }
}
