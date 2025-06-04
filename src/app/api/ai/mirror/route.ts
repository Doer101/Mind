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
          max_length: 200,
          min_length: 50,
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
    return "I apologize, but I couldn't generate a proper reflection. Please try again.";
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

    // Generate reflection using Pegasus
    const reflection = await callPegasusAPI(content);

    // Store the reflection
    const { error } = await supabase.from("creativity_mirror").insert({
      user_id: user.id,
      content: content,
      reflection: reflection,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing reflection:", error);
    }

    return NextResponse.json({ reflection });
  } catch (error) {
    console.error("Error processing reflection:", error);
    return NextResponse.json(
      { error: "Failed to process reflection" },
      { status: 500 }
    );
  }
}
