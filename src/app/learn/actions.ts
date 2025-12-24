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
      user_field_progress(unlocked, field_level, field_xp)
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
    .from("module_quest_templates")
    .select("*")
    .eq("sub_module_id", subModuleId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching sub-module quests from templates:", error);
    return [];
  }
  
  // Transform to match Quest interface if needed (add 'status' placeholder)
  // The UI merges user progress later, so 'status' here is just default.
  return quests.map(q => ({
    ...q,
    id: q.id, // This is the template_id now
    status: 'active',
    quest_category: 'core'
  }));
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

  // 3. Fetch all user progress for core quests from user_module_quest_progress
  const { data: rawUserProgress } = await supabase
    .from("user_module_quest_progress")
    .select("module_quest_template_id, completed")
    .eq("user_id", user.id);

  // Convert progress to a Set of completed quest template IDs
  const completedQuestIds = new Set(
    (rawUserProgress || [])
      .filter(p => p.completed)
      .map(p => p.module_quest_template_id)
  );

  // Fetch all quest templates to calculate total and completed counts per sub-module
  const { data: allCoreQuests } = await supabase
    .from("module_quest_templates")
    .select("id, sub_module_id")
    .in("sub_module_id", modules.flatMap(m => m.sub_modules.map((sm: any) => sm.id)));

  // Calculate total quests per sub-module
  const subModuleCoreTotal = (allCoreQuests || []).reduce((acc: any, q) => {
    if (q.sub_module_id) {
       acc[q.sub_module_id] = (acc[q.sub_module_id] || 0) + 1;
    }
    return acc;
  }, {});

  // Calculate completed quests per sub-module
  const subModuleCompletedCount = (allCoreQuests || []).reduce((acc: any, q) => {
    if (q.sub_module_id && completedQuestIds.has(q.id)) {
       acc[q.sub_module_id] = (acc[q.sub_module_id] || 0) + 1;
    }
    return acc;
  }, {});

  // 4. Compute lock status sequentially (two-pass approach)
  const modulesWithSubModuleStatus = modules.map(module => {
    // First pass: Calculate completion state for all sub-modules
    const sortedSubModules = (module.sub_modules || [])
      .sort((a: any, b: any) => a.order_index - b.order_index);
    
    const subModulesWithCompletion = sortedSubModules.map((sm: any) => {
      const totalQuests = subModuleCoreTotal[sm.id] || 0;
      const completedQuests = subModuleCompletedCount[sm.id] || 0;
      const completionPercentage = totalQuests > 0 
        ? Math.round((completedQuests / totalQuests) * 100) 
        : 0;
      const isCompleted = completionPercentage === 100;
      
      return {
        ...sm,
        isCompleted,
        completionPercentage,
        questStats: {
          completed: completedQuests,
          total: totalQuests
        }
      };
    });

    // Second pass: Determine unlock status based on previous sub-module
    const processedSubModules = subModulesWithCompletion.map((sm: any, index: number) => {
      // SEQUENTIAL UNLOCK LOGIC:
      // - First sub-module (index 0) is always unlocked
      // - Subsequent sub-modules unlock ONLY when previous is 100% complete
      let isUnlocked = false;
      if (index === 0) {
        isUnlocked = true;
      } else {
        const previousSubModule = subModulesWithCompletion[index - 1];
        isUnlocked = previousSubModule?.isCompleted === true;
      }
      
      return {
        ...sm,
        isUnlocked
      };
    });

    const moduleStats = processedSubModules.reduce((acc: { completed: number, total: number }, sm: any) => ({
      completed: acc.completed + sm.questStats.completed,
      total: acc.total + sm.questStats.total
    }), { completed: 0, total: 0 });

    // Determine if the *module* itself is complete (all sub-modules complete)
    // A module with 0 sub-modules is considered incomplete by default or complete?
    // Let's assume complete if it has 0 sub-modules, or strictly check completion.
    // If stats.total > 0 and stats.completed === stats.total, then complete.
    // If total is 0, let's treat as incomplete to avoid auto-unlocking empty modules in a potentially weird way,
    // OR treat as complete if we want to skip empty placeholders. 
    // Given the prompt "moduleCompleted = completedSubModules === totalSubModules", implies count based.
    const isModuleCompleted = moduleStats.total > 0 && moduleStats.completed === moduleStats.total;

    return {
      ...module,
      sub_modules: processedSubModules,
      moduleStats,
      isModuleCompleted
    };
  });

  // 5. Compute MODULE unlock status sequentially
  // Module 0 is unlocked. Module N unlocked if Module N-1 is complete.
  const processedModules = modulesWithSubModuleStatus.map((module, index) => {
    let isUnlocked = false;
    if (index === 0) {
      isUnlocked = true;
    } else {
      const previousModule = modulesWithSubModuleStatus[index - 1];
      isUnlocked = previousModule.isModuleCompleted === true;
    }

    // Pass the isUnlocked flag down to the module object
    return {
      ...module,
      isUnlocked
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
    .eq("sub_module_id", subModuleId);

  if (tError || !templates || templates.length === 0) {
    console.error("No templates found for sub-module:", subModuleId);
    return { success: false, error: "No quest templates found for this sub-module" };
  }

  // 4. Instantiate quests from templates (DEPRECATED: Now using global templates)
  // We no longer duplicate templates into the quests table.
  // This function now merely serves as a check, but we return success immediately.
  // Future: Could be used to mark "started_at" in a tracking table if needed.
  
  return { success: true };
}
