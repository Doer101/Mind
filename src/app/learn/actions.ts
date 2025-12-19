"use server";

import { createClient } from "@/supabase/server";

export async function getLearningFields() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch user global level for "Unlocks at level X" message
  const { data: globalProgress } = await supabase
    .from("user_global_progress")
    .select("global_level")
    .eq("user_id", user.id)
    .single();

  const userGlobalLevel = globalProgress?.global_level || 1;

  // Fetch fields and user-specific progress (including 'unlocked' status)
  const { data: fields, error } = await supabase
    .from("fields")
    .select(`
      *,
      user_field_progress!inner(unlocked, field_level, field_xp)
    `)
    .eq("user_field_progress.user_id", user.id)
    .order("unlock_global_level", { ascending: true });

  if (error) {
    console.error("Error fetching learning fields:", error);
    return [];
  }

  return fields.map(f => ({
    ...f,
    progress: (f.user_field_progress as any)?.[0] || { unlocked: false, field_level: 1, field_xp: 0 },
    userGlobalLevel
  }));
}

export async function getFieldModules(fieldId: string) {
  const supabase = await createClient();
  const { data: modules, error } = await supabase
    .from("modules")
    .select("*")
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
  return modules;
}

export async function getModuleSubModules(moduleId: string, userId: string) {
  const supabase = await createClient();
  
  // Fetch sub-modules
  const { data: subModules, error } = await supabase
    .from("sub_modules")
    .select("*")
    .eq("module_id", moduleId)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching sub-modules:", error);
    return [];
  }

  // Fetch user quest progress for these sub-modules to determine completion
  const { data: progresses } = await supabase
    .from("user_quest_progress")
    .select("completed, quest_id, quests!inner(sub_module_id)")
    .eq("user_id", userId);

  // Map sub-modules with completion status and lock status
  // For simplicity in this linear path, we will determine lock status based on the previous sub-module's completion
  // In a real scenario, this would be computed by a more complex query or reducer
  return subModules;
}

export async function getSubModuleQuests(subModuleId: string) {
  const supabase = await createClient();
  const { data: quests, error } = await supabase
    .from("quests")
    .select("*")
    .eq("sub_module_id", subModuleId)
    .eq("quest_category", "core");

  if (error) {
    console.error("Error fetching sub-module quests:", error);
    return [];
  }
  return quests;
}

export async function getFieldLearningPath(fieldId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Fetch user field progress and levels
  const [{ data: fieldProgress }, { data: levels }] = await Promise.all([
    supabase
      .from("user_field_progress")
      .select("field_level, field_xp")
      .eq("user_id", user.id)
      .eq("field_id", fieldId)
      .single(),
    supabase
      .from("user_levels")
      .select("*")
      .order("level", { ascending: true })
  ]);

  const currentLevel = fieldProgress?.field_level || 1;
  const currentXP = fieldProgress?.field_xp || 0;

  let nextXP = 100;
  if (levels && levels.length > 0) {
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].level === currentLevel + 1) {
        nextXP = levels[i].xp_required;
        break;
      }
    }
  }

  // 2. Fetch all modules and sub-modules for this field
  const { data: modules, error } = await supabase
    .from("modules")
    .select(`
      *,
      sub_modules(*)
    `)
    .eq("field_id", fieldId)
    .order("unlock_field_level", { ascending: true });

  if (error) {
    console.error("Error fetching path:", error);
    return null;
  }

  // 3. Fetch user progress for all mandatory core quests in this field
  const { data: qProgress } = await supabase
    .from("user_quest_progress")
    .select("completed, quest_id, quests!inner(sub_module_id, is_mandatory, quest_category)")
    .eq("user_id", user.id)
    .eq("quests.quest_category", "core")
    .eq("quests.is_mandatory", true);

  // Group by sub_module_id to see which sub-modules have all mandatory quests completed
  // We also need the counts of mandatory quests per sub-module to compare
  const { data: mandatoryCounts } = await supabase
    .from("quests")
    .select("sub_module_id, id")
    .eq("quest_category", "core")
    .eq("is_mandatory", true);

  const subModuleMandatoryTotal = (mandatoryCounts || []).reduce((acc: any, q) => {
    if (q.sub_module_id) {
       acc[q.sub_module_id] = (acc[q.sub_module_id] || 0) + 1;
    }
    return acc;
  }, {});

  const subModuleCompletedCount = (qProgress || []).reduce((acc: any, p) => {
    if (p.completed && (p.quests as any).sub_module_id) {
       acc[(p.quests as any).sub_module_id] = (acc[(p.quests as any).sub_module_id] || 0) + 1;
    }
    return acc;
  }, {});

  const completedIds = new Set();
  Object.keys(subModuleMandatoryTotal).forEach(smId => {
    if ((subModuleCompletedCount[smId] || 0) >= (subModuleMandatoryTotal[smId] || 0) && subModuleMandatoryTotal[smId] > 0) {
      completedIds.add(smId);
    }
  });

  // Calculate total vs completed for each sub_module
  const { data: allCoreQuests } = await supabase
    .from("quests")
    .select("id, sub_module_id")
    .eq("quest_category", "core")
    .eq("field_id", fieldId);

  const subModuleCoreTotal = (allCoreQuests || []).reduce((acc: any, q) => {
    if (q.sub_module_id) {
       acc[q.sub_module_id] = (acc[q.sub_module_id] || 0) + 1;
    }
    return acc;
  }, {});

  // 4. Compute lock status linearly
  let previousCompleted = true; // First sub-module in the first module is unlocked
  
  const processedModules = modules.map(module => {
    const processedSubModules = (module.sub_modules || [])
      .sort((a: any, b: any) => a.order_index - b.order_index)
      .map((sm: any) => {
        const isCompleted = completedIds.has(sm.id);
        const levelMet = currentLevel >= (sm.unlock_field_level || 0);
        // A sub-module is unlocked if everything before it is completed AND user level is high enough
        const isUnlocked = previousCompleted && levelMet;
        
        previousCompleted = isCompleted; // The next sub-module depends on this one
        
        return {
          ...sm,
          isCompleted,
          isUnlocked,
          questStats: {
            completed: subModuleCompletedCount[sm.id] || 0,
            total: subModuleCoreTotal[sm.id] || 0
          }
        };
      });

    const moduleStats = processedSubModules.reduce((acc: { completed: number, total: number }, sm: any) => ({
      completed: acc.completed + sm.questStats.completed,
      total: acc.total + sm.questStats.total
    }), { completed: 0, total: 0 });

    return {
      ...module,
      sub_modules: processedSubModules,
      moduleStats
    };
  });

  return {
    fieldId,
    currentLevel,
    currentXP,
    nextXP,
    modules: processedModules
  };
}

export async function getSubModuleDetails(subModuleId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sub_modules")
    .select("*, modules!inner(*)")
    .eq("id", subModuleId)
    .single();

  if (error) {
    console.error("Error fetching sub-module details:", error);
    return null;
  }
  return data;
}

export async function startSubModule(subModuleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Check if core quests already exist for this user/sub-module
  const { data: existingQuests } = await supabase
    .from("quests")
    .select("id")
    .eq("user_id", user.id)
    .eq("sub_module_id", subModuleId)
    .eq("quest_category", "core")
    .limit(1);

  if (existingQuests && existingQuests.length > 0) {
    return { success: true, message: "Quests already exist" };
  }

  // 2. Fetch sub-module hierarchy to get moduleId and fieldId
  const { data: subModule, error: smError } = await supabase
    .from("sub_modules")
    .select("*, modules!inner(id, field_id)")
    .eq("id", subModuleId)
    .single();

  if (smError || !subModule) {
    console.error("Error fetching sub-module for instantiation:", smError);
    return { success: false, error: "Sub-module not found" };
  }

  const moduleId = subModule.module_id;
  const fieldId = (subModule.modules as any).field_id;

  // 3. Fetch templates from module_quest_templates
  const { data: templates, error: tError } = await supabase
    .from("module_quest_templates")
    .select("*")
    .eq("module_id", moduleId);

  if (tError || !templates || templates.length === 0) {
    console.error("No templates found for module:", moduleId);
    return { success: false, error: "No quest templates found for this module" };
  }

  // 4. Instantiate quests from templates
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7); // 7-day deadline for core quests

  const questsToInsert = templates
    .filter(t => t.title && t.description) // Ensure no null titles or descriptions
    .map(template => ({
      user_id: user.id,
      title: template.title,
      description: template.description,
      xp_reward: template.xp_reward || 10,
      difficulty: template.difficulty || 'medium',
      type: template.type || 'challenge',
      quest_category: 'core',
      is_mandatory: true,
      field_id: fieldId,
      module_id: moduleId,
      sub_module_id: subModuleId,
      status: 'active',
      deadline: deadline.toISOString()
    }));

  if (questsToInsert.length === 0) {
    console.error("No valid templates (missing title/description) for module:", moduleId);
    return { success: false, error: "Found templates but they were invalid (missing titles)" };
  }

  const { error: iError } = await supabase.from("quests").insert(questsToInsert);

  if (iError) {
    console.error("Error inserting core quests into database:", iError);
    return { success: false, error: `Database Error: ${iError.message}` };
  }

  return { success: true };
}
