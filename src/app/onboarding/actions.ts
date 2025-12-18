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

export async function saveSurveyAnswers(fieldId: string, skillScores: { skill: string; score: number }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!Array.isArray(skillScores)) {
    throw new Error("Invalid survey data format: expected array");
  }

  const rows = skillScores.map(ss => ({
    user_id: user.id,
    field_id: fieldId,
    skill: ss.skill.toLowerCase(),
    score: Math.max(0, Math.min(100, ss.score))
  }));

  const { error } = await supabase.from("user_surveys").insert(rows);

  if (error) {
    console.error("Error saving survey answers:", error);
    throw new Error("Failed to save survey answers");
  }

  return await calculateInitialFieldLevel(skillScores);
}

export async function calculateInitialFieldLevel(skillScores: { skill: string; score: number }[]) {
  if (skillScores.length === 0) return 1;

  const average = skillScores.reduce((acc, val) => acc + val.score, 0) / skillScores.length;

  if (average <= 20) return 1;
  if (average <= 40) return 2;
  if (average <= 60) return 3;
  if (average <= 80) return 4;
  return 5;
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
