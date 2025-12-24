import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subModuleId = searchParams.get("sub_module_id");

    if (!subModuleId) {
      return NextResponse.json({ error: "sub_module_id is required" }, { status: 400 });
    }

    // Fetch core quests from templates (Global Source)
    const { data: quests, error: questError } = await supabase
      .from("module_quest_templates")
      .select("*")
      .eq("sub_module_id", subModuleId)
      .order("created_at", { ascending: true });

    if (questError) {
      console.error("Error fetching core quests:", questError);
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
    }

    // Return in the format expected by QuestSystem
    return NextResponse.json({
      dailyQuests: quests?.map(q => ({ ...q, id: q.id, status: 'active', quest_category: 'core' })) || [],
      penaltyQuests: [], // Core quests generally don't have penalty system active in this context mostly
    });
  } catch (error) {
    console.error("Error in GET /api/learn/quests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
