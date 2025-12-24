"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { createClient } from "../../supabase/client";
import { Trophy, Plus, Activity } from "lucide-react";
import Link from "next/link";
import RippleLoader from "./ui/rippleLoader";

interface QuestContribution {
  date: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  hasCore: boolean;
}

interface QuestData {
  difficulty: string;
  xp_reward: number;
  quest_category: string;
}

interface CompletedQuest {
  completed_at: string;
  quests: QuestData;
}

interface ContributionGraphProps {
  userId: string;
}

export default function QuestContributionGraph({
  userId,
}: ContributionGraphProps) {
  const [contributions, setContributions] = useState<QuestContribution[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalQuests, setTotalQuests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ✅ Helper for local date normalization
  const normalizeToLocalDateStr = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
  };

  // Date helpers
  const startOfWeek = (date: Date, weekStartsOn: number = 0) => {
    const d = new Date(date);
    const day = (d.getDay() - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const addWeeks = (date: Date, weeks: number) => addDays(date, weeks * 7);

  const endOfWeek = (date: Date, weekStartsOn: number = 0) => {
    const s = startOfWeek(date, weekStartsOn);
    return addDays(s, 6);
  };

  // Initialize Supabase
  useEffect(() => {
    try {
      const client = createClient();
      setSupabase(client);
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
    }
  }, []);

  useEffect(() => {
    if (supabase) {
      fetchQuestContributions();
    }
  }, [userId, supabase, selectedYear]);

  // Scroll to end (most recent) on mobile after data loads
  useEffect(() => {
    if (!loading && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Scroll to the end to show recent contributions
      container.scrollLeft = container.scrollWidth;
    }
  }, [loading, contributions]);

  const fetchQuestContributions = async () => {
    if (!supabase) return;

    try {
      setLoading(true);

      const today = new Date();
      const isCurrentYear = selectedYear === today.getFullYear();
      const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31);
      const endWeek = endOfWeek(endDate, 0);
      const startWeek = addWeeks(startOfWeek(endWeek, 0), -51);

      const dateFromISO = startWeek.toISOString();
      const dateToISO = addDays(endWeek, 1).toISOString();

      // 1. Fetch Side Quests
      let { data: sideQuestsData, error: sideError } = (await supabase
        .from("user_quest_progress")
        .select(
          `
          completed_at,
          quests!inner(
            difficulty,
            xp_reward,
            quest_category
          )
        `
        )
        .eq("user_id", userId)
        .eq("completed", true)
        .not("completed_at", "is", null)
        .gte("completed_at", dateFromISO)
        .lt("completed_at", dateToISO)
        .order("completed_at", { ascending: true })) as {
        data: CompletedQuest[] | null;
        error: any;
      };

      // 🔁 Fallback for Side Quests if join fails
      if (sideError) {
        // ... (keep existing fallback logic if needed, or rely on main query)
        // For brevity in this merge, assuming main query works or simple fallback
        // Re-implementing simplified fallback if strict necessary, but keeping it concise
        const { data: progressData } = await supabase
          .from("user_quest_progress")
          .select("completed_at, quest_id")
          .eq("user_id", userId)
          .eq("completed", true)
          .not("completed_at", "is", null)
          .gte("completed_at", dateFromISO)
          .lt("completed_at", dateToISO);
        
        if (progressData && progressData.length > 0) {
           const questIds = progressData.map((p: any) => p.quest_id);
           const { data: questsData } = await supabase
             .from("quests")
             .select("id, difficulty, xp_reward, quest_category")
             .in("id", questIds);
           
           sideQuestsData = progressData.map((p: any) => {
             const q = questsData?.find((x: any) => x.id === p.quest_id);
             if (!q) return null;
             return {
               completed_at: p.completed_at,
               quests: {
                 difficulty: q.difficulty,
                 xp_reward: q.xp_reward,
                 quest_category: q.quest_category
               }
             };
           }).filter(Boolean) as CompletedQuest[];
        }
      }

      // 2. Fetch Core Quests
      const { data: coreQuestsData, error: coreError } = await supabase
        .from("user_module_quest_progress")
        .select(`
          completed_at,
          module_quest_templates!inner(
            xp_reward
          )
        `)
        .eq("user_id", userId)
        .eq("completed", true)
        .not("completed_at", "is", null)
        .gte("completed_at", dateFromISO)
        .lt("completed_at", dateToISO);

      // 3. Normalize & Merge
      const sideQuests = sideQuestsData || [];
      const coreQuests = (coreQuestsData || []).map((p: any) => ({
        completed_at: p.completed_at,
        quests: {
          difficulty: 'medium', // Default difficulty for core quests
          xp_reward: p.module_quest_templates.xp_reward,
          quest_category: 'core'
        }
      })) as CompletedQuest[];

      const completedQuests = [...sideQuests, ...coreQuests].sort(
        (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );

      // Build contribution map
      const contributionMap = new Map<string, QuestContribution>();
      for (let i = 0; i < 364; i++) {
        const date = addDays(startWeek, i);
        const dateStr = normalizeToLocalDateStr(date);
        contributionMap.set(dateStr, {
          date: dateStr,
          easy: 0,
          medium: 0,
          hard: 0,
          total: 0,
          hasCore: false,
        });
      }
      // Fill contribution map with completed quests
      completedQuests?.forEach((questProgress) => {
        if (questProgress.completed_at && questProgress.quests) {
          const dateStr = normalizeToLocalDateStr(
            new Date(questProgress.completed_at)
          );
          const existing = contributionMap.get(dateStr);

          if (existing) {
            let difficulty: "easy" | "medium" | "hard";
            if (questProgress.quests.xp_reward <= 8) difficulty = "easy";
            else if (questProgress.quests.xp_reward <= 15)
              difficulty = "medium";
            else difficulty = "hard";

            existing[difficulty]++;
            existing.total++;
            if (questProgress.quests.quest_category === 'core') {
              existing.hasCore = true;
            }
            contributionMap.set(dateStr, existing);
          }
        }
      });

      const contributionsArray = Array.from(contributionMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setContributions(contributionsArray);
      setTotalQuests(completedQuests?.length || 0);
      calculateStreaks(contributionsArray);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (contributions: QuestContribution[]) => {
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day));
    };

    const activeDays = new Set(
      contributions
        .filter((c) => c.total > 0)
        .map((c) => normalizeToLocalDateStr(parseDate(c.date)))
    );

    // Calculate Longest Streak
    let longestStreakCount = 0;
    if (activeDays.size > 0) {
      const sortedDates = Array.from(activeDays).sort();
      let currentLongest = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = parseDate(sortedDates[i]);
        const prevDate = parseDate(sortedDates[i - 1]);
        const diff =
          (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);

        if (diff === 1) {
          currentLongest++;
        } else {
          longestStreakCount = Math.max(longestStreakCount, currentLongest);
          currentLongest = 1;
        }
      }
      longestStreakCount = Math.max(longestStreakCount, currentLongest);
    }
    setLongestStreak(longestStreakCount);

    // Calculate Current Streak
    let currentStreakCount = 0;
    const today = new Date();
    const todayStr = normalizeToLocalDateStr(today);

    if (activeDays.has(todayStr)) {
      currentStreakCount = 1;
      let prevDate = new Date(today);
      while (true) {
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = normalizeToLocalDateStr(prevDate);
        if (activeDays.has(prevDateStr)) {
          currentStreakCount++;
        } else {
          break;
        }
      }
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = normalizeToLocalDateStr(yesterday);
      if (activeDays.has(yesterdayStr)) {
        currentStreakCount = 1;
        let prevDate = new Date(yesterday);
        while (true) {
          prevDate.setDate(prevDate.getDate() - 1);
          const prevDateStr = normalizeToLocalDateStr(prevDate);
          if (activeDays.has(prevDateStr)) {
            currentStreakCount++;
          } else {
            break;
          }
        }
      }
    }

    setCurrentStreak(currentStreakCount);
  };

  const getContributionColor = (contribution: QuestContribution) => {
    const total = contribution.total;
    if (total === 0) return "bg-white/10"; // dark neutral for zero activity

    // Determine primary difficulty for color
    let primaryDifficulty: "easy" | "medium" | "hard" = "easy";
    if (contribution.hard > 0) {
      primaryDifficulty = "hard";
    } else if (contribution.medium > 0) {
      primaryDifficulty = "medium";
    }

    // Color intensity based on total quests completed
    const intensity = Math.min(total, 5); // Cap at 5 for color intensity

    // If day has Core quest(s), use a Strong primary color (Teal/Indigo brand feel)
    if (contribution.hasCore) {
      return [
        "bg-teal-200",
        "bg-teal-300",
        "bg-teal-400",
        "bg-teal-500",
        "bg-teal-600",
      ][intensity - 1];
    }

    // Side quests: muted versions of original colors
    switch (primaryDifficulty) {
      case "easy":
        return [
          "bg-green-100/60",
          "bg-green-200/60",
          "bg-green-300/60",
          "bg-green-400/60",
          "bg-green-500/60",
        ][intensity - 1];
      case "medium":
        return [
          "bg-blue-100/60",
          "bg-blue-200/60",
          "bg-blue-300/60",
          "bg-blue-400/60",
          "bg-blue-500/60",
        ][intensity - 1];
      case "hard":
        return [
          "bg-purple-100/60",
          "bg-purple-200/60",
          "bg-purple-300/60",
          "bg-purple-400/60",
          "bg-purple-500/60",
        ][intensity - 1];
      default:
        return "bg-green-100/60";
    }
  };

  const getTooltipContent = (contribution: QuestContribution) => {
    if (contribution.total === 0) {
      return "No quests completed";
    }

    const parts = [];
    if (contribution.easy > 0) parts.push(`${contribution.easy} easy`);
    if (contribution.medium > 0) parts.push(`${contribution.medium} medium`);
    if (contribution.hard > 0) parts.push(`${contribution.hard} hard`);

    return `${contribution.total} quest${
      contribution.total > 1 ? "s" : ""
    } completed (${parts.join(", ")})`;
  };

  const getMonthPositions = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const today = new Date();
    const isCurrentYear = selectedYear === today.getFullYear();
    const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31);
    const endWeek = endOfWeek(endDate, 0);
    const startWeek = addWeeks(startOfWeek(endWeek, 0), -51);

    const positions: { month: string; column: number }[] = [];
    let prevMonth = -1;

    for (let w = 0; w < 52; w++) {
      const weekStart = addDays(startWeek, w * 7);
      const month = weekStart.getMonth();

      if (month !== prevMonth) {
        positions.push({
          month: monthNames[month],
          column: w,
        });
        prevMonth = month;
      }
    }

    return positions;
  };

  if (loading || !supabase) {
    return (
      <div className="flex items-center justify-center p-8 bg-black/70 border border-white/10 rounded-xl h-[400px]">
        <RippleLoader icon={<Trophy />} size={200} duration={2} logoColor="white" />
      </div>
    );
  }

  const monthPositions = getMonthPositions();

  return (
    <Card className="bg-black/70 border-white/10 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-white" /> Quest Contribution Graph
        </CardTitle>
        <CardDescription className="text-white/70">
          {totalQuests} quests completed in the last year
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Year Selector */}
        <div className="flex justify-center md:justify-end gap-2">
          {[0, 1, 2].map((offset) => {
            const year = new Date().getFullYear() - offset;
            const isActive = selectedYear === year;
            return (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>

        {/* Stats Cards - Optimized for Mobile */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 p-3 sm:p-4 border border-white/10 rounded-lg bg-white/5">
            <div className="text-xl sm:text-2xl font-bold text-green-500">
              {currentStreak}
            </div>
            <div className="text-xs sm:text-sm text-white/80 mt-0.5">
              Current Streak
            </div>
            {currentStreak > 0 && (
              <div className="text-xs text-green-400 mt-1">
                🔥 {currentStreak} day{currentStreak > 1 ? "s" : ""} strong!
              </div>
            )}
          </div>

          <div className="flex-1 p-3 sm:p-4 border border-white/10 rounded-lg bg-white/5">
            <div className="text-xl sm:text-2xl font-bold text-blue-500">
              {longestStreak}
            </div>
            <div className="text-xs sm:text-sm text-white/80 mt-0.5">
              Longest Streak
            </div>
            {longestStreak > 0 && (
              <div className="text-xs text-blue-400 mt-1">
                🏆 Personal best!
              </div>
            )}
          </div>

          <div className="flex-1 p-3 sm:p-4 border border-white/10 rounded-lg bg-white/5">
            <div className="text-xl sm:text-2xl font-bold text-purple-500">
              {totalQuests}
            </div>
            <div className="text-xs sm:text-sm text-white/80 mt-0.5">
              Total Quests
            </div>
            {totalQuests > 0 && (
              <div className="text-xs text-purple-400 mt-1">
                ⭐ Great progress!
              </div>
            )}
          </div>
        </div>

        {/* Contribution Graph Container */}
        <div className="border border-white/10 rounded-lg p-3 sm:p-4 bg-white/5 min-w-0">
          {/* Mobile: Scrollable without day labels */}
          <div className="md:hidden" style={{ minWidth: 0, maxWidth: '100%' }}>
            <div 
              className="overflow-x-scroll pb-2"
              style={{
                WebkitOverflowScrolling: 'touch',
                minWidth: 0,
                maxWidth: '100%',
              }}
            >
              <div style={{ width: '832px', minWidth: '832px' }}>
                {/* Month Labels */}
                <div className="relative h-5 mb-1">
                  {getMonthPositions().map((pos, idx) => (
                    <div
                      key={idx}
                      className="absolute text-[10px] text-white/70"
                      style={{
                        left: `${pos.column * 16}px`,
                      }}
                    >
                      {pos.month}
                    </div>
                  ))}
                </div>

                {/* Contribution Grid */}
                <div 
                  className="grid grid-rows-7 grid-flow-col gap-[3px]"
                  style={{
                    gridTemplateColumns: 'repeat(52, 13px)',
                  }}
                >
                  {contributions.map((contribution) => {
                    const isToday =
                      contribution.date ===
                      new Date().toISOString().split("T")[0];

                    return (
                      <div
                        key={contribution.date}
                        className={`w-[13px] h-[13px] rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-white/50 ${getContributionColor(
                          contribution
                        )} ${
                          isToday
                            ? "ring-2 ring-white ring-offset-1 ring-offset-black/70"
                            : ""
                        }`}
                        title={`${contribution.date}: ${getTooltipContent(
                          contribution
                        )}${isToday ? " (Today)" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Centered with day labels */}
          <div className="hidden md:flex justify-center gap-2">
            {/* Day Labels */}
            <div className="flex flex-col text-[9px] text-white/60 justify-around pt-5 pb-1">
              <div>Mon</div>
              <div>Wed</div>
              <div>Fri</div>
            </div>

            {/* Graph Content */}
            <div>
              {/* Month Labels */}
              <div className="relative h-5 mb-1" style={{ width: '832px' }}>
                {getMonthPositions().map((pos, idx) => (
                  <div
                    key={idx}
                    className="absolute text-[10px] text-white/70"
                    style={{
                      left: `${pos.column * 16}px`,
                    }}
                  >
                    {pos.month}
                  </div>
                ))}
              </div>

              {/* Contribution Grid */}
              <div 
                className="grid grid-rows-7 grid-flow-col gap-[3px]"
                style={{
                  gridTemplateColumns: 'repeat(52, 13px)',
                }}
              >
                {contributions.map((contribution) => {
                  const isToday =
                    contribution.date ===
                    new Date().toISOString().split("T")[0];

                  return (
                    <div
                      key={contribution.date}
                      className={`w-[13px] h-[13px] rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-white/50 ${getContributionColor(
                        contribution
                      )} ${
                        isToday
                          ? "ring-2 ring-white ring-offset-1 ring-offset-black/70"
                          : ""
                      }`}
                      title={`${contribution.date}: ${getTooltipContent(
                        contribution
                      )}${isToday ? " (Today)" : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Difficulty Legend */}
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mt-3 text-xs text-white/70">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-teal-400 rounded-sm"></div>
              <span>Core Paths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-300/60 rounded-sm"></div>
              <span>Side Quests</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {selectedYear === new Date().getFullYear() && totalQuests === 0 && (
          <div className="p-4 bg-gradient-to-r from-green-950/30 to-blue-950/30 rounded-lg border border-green-800/50">
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-green-200">
                Start Your Quest Journey!
              </h4>
              <p className="text-sm text-green-300/80">
                Complete your first quest to begin building your contribution
                streak.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/dashboard/quests">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Quests
                </Link>
              </Button>
            </div>
          </div>
        )}

        {selectedYear === new Date().getFullYear() &&
          totalQuests > 0 &&
          currentStreak === 0 && (
            <div className="p-4 bg-gradient-to-r from-orange-950/30 to-red-950/30 rounded-lg border border-orange-800/50">
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-orange-200">
                  Keep Your Streak Alive!
                </h4>
                <p className="text-sm text-orange-300/80">
                  Complete a quest today to maintain your momentum.
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/dashboard/quests">
                    <Plus className="w-4 h-4 mr-2" />
                    Get New Quests
                  </Link>
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
