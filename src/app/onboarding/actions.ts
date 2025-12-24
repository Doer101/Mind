"use server";

import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";

export async function getFields() {
  const supabase = await createClient();
  const { data: userGlobal } = await supabase.auth.getUser();
  
  if (!userGlobal.user) return [];

  const { data: globalProgress } = await supabase
    .from("user_global_progress")
    .select("global_level")
    .eq("user_id", userGlobal.user.id)
    .single();

  const userLevel = globalProgress?.global_level || 1;

  const { data: fields, error } = await supabase
    .from("fields")
    .select("*")
    .order("unlock_global_level", { ascending: true });

  if (error) {
    console.error("Error fetching fields:", error);
    return [];
  }

  return fields.map((field) => ({
    ...field,
    isLocked: userLevel < field.unlock_global_level,
  }));
}

export async function initializeUserProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: existing } = await supabase
    .from("user_global_progress")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    const { error } = await supabase.from("user_global_progress").insert({
      user_id: user.id,
      global_level: 1,
      global_xp: 0,
      league: "bronze",
    });

    if (error) {
      console.error("Error initializing user global progress:", error);
      throw new Error("Failed to initialize user progress");
    }
  }
}

// Helper to calculate cycle (level) based on answers
function calculateCycleFromSurvey(answers: any): number {
  let level = 1;

  // Logic: 
  // Frequency: 1-2 (Low), 3-4 (Med), 5+ (High)
  // Consistency: new (Low), 1month (Low), 6months (Med), years (High)

  if (answers.frequency === "5+ times" && (answers.consistency === "6months" || answers.consistency === "years")) {
    level = 4; // Advanced
  } else if (answers.frequency === "3-4 times" && (answers.consistency === "6months" || answers.consistency === "years")) {
    level = 3; // Intermediate
  } else if (answers.frequency === "3-4 times" || answers.consistency === "6months") {
    level = 2; // Beginner-Intermediate
  } else {
    level = 1; // Foundation
  }
  
  return level;
}

export async function saveSurveyAnswers(fieldId: string, answers: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Calculate starting cycle
  const initialLevel = calculateCycleFromSurvey(answers);

  // Note: We are NOT inserting into user_surveys as it doesn't support JSON structured data easily without schema change.
  // Instead, we will rely on the returned 'initialLevel' which is passed to 'completeOnboarding' to set the user's field level.
  // Ideally, we would store 'answers' in a 'metadata' column in 'user_field_progress' but schema changes are restricted/unverified.
  // Since the user requirement says "Used ONLY to determine starting CYCLE", calculating it here and returning it effectively fulfills the logic requirement.
  
  return initialLevel;
}



export async function completeOnboarding(fieldId: string, initialLevel: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Fetch all fields to initialize progress for all
  const { data: allFields } = await supabase.from("fields").select("id");

  if (!allFields) throw new Error("No fields found");

  const progressRows = allFields.map((field) => ({
    user_id: user.id,
    field_id: field.id,
    field_level: field.id === fieldId ? initialLevel : 1,
    field_xp: 0,
    unlocked: field.id === fieldId,
  }));

  const { error } = await supabase.from("user_field_progress").upsert(progressRows, {
    onConflict: "user_id, field_id",
  });

  if (error) {
    console.error("Error completing onboarding:", error);
    throw new Error("Failed to complete onboarding");
  }

  return redirect("/dashboard");
}
