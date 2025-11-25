import { createClient } from "@/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/todos - Get all todos for the authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/todos - Starting request");
    const supabase = await createClient();
    console.log("Supabase client created");
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Auth check result:", { user: user?.id, authError });
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return NextResponse.json({ error: "Unauthorized", details: authError?.message }, { status: 401 });
    }

    console.log(`Fetching todos for user: ${user.id}`);
    
    // Get all todos for this user
    const { data: todos, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching todos:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Successfully fetched ${todos?.length || 0} todos`);
    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Error in GET /api/todos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, text, color } = body;

    if (!date || !text || !color) {
      return NextResponse.json(
        { error: "Missing required fields: date, text, color" },
        { status: 400 }
      );
    }

    // Insert new todo
    const { data: todo, error } = await supabase
      .from("todos")
      .insert({
        user_id: user.id,
        date,
        text,
        color,
        completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating todo:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/todos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/todos - Update a todo
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, text, completed } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (text !== undefined) updates.text = text;
    if (completed !== undefined) updates.completed = completed;

    // Update todo (only if it belongs to the user)
    const { data: todo, error } = await supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating todo:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error("Error in PATCH /api/todos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/todos - Delete a todo
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Delete todo (only if it belongs to the user)
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting todo:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/todos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
