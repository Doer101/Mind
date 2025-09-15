"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { createClient } from "../../supabase/client";
import { Trophy, Plus } from "lucide-react";
import Link from "next/link";

interface QuestContribution {
  date: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

interface QuestData {
  difficulty: string;
  xp_reward: number;
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

      let { data: completedQuests, error } = (await supabase
        .from("user_quest_progress")
        .select(
          `
          completed_at,
          quests!inner(
            difficulty,
            xp_reward
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

      // 🔁 Fallback if join fails
      if (error) {
        const { data: progressData, error: progressError } = (await supabase
          .from("user_quest_progress")
          .select("completed_at, quest_id")
          .eq("user_id", userId)
          .eq("completed", true)
          .not("completed_at", "is", null)
          .gte("completed_at", dateFromISO)
          .lt("completed_at", dateToISO)) as {
          data: { completed_at: string; quest_id: string }[] | null;
          error: any;
        };

        if (progressError) return;

        if (progressData && progressData.length > 0) {
          const questIds = progressData.map((p) => p.quest_id);
          const { data: questsData } = (await supabase
            .from("quests")
            .select("id, difficulty, xp_reward")
            .in("id", questIds)) as {
            data:
              | { id: string; difficulty: string; xp_reward: number }[]
              | null;
          };

          completedQuests = progressData
            .map((progress) => {
              const quest = questsData?.find((q) => q.id === progress.quest_id);
              if (quest) {
                return {
                  completed_at: progress.completed_at,
                  quests: {
                    difficulty: quest.difficulty,
                    xp_reward: quest.xp_reward,
                  },
                } as CompletedQuest;
              }
              return null;
            })
            .filter((item): item is CompletedQuest => item !== null);
        }
      }

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
    let currentStreakCount = 0;
    let longestStreakCount = 0;

    const normalized = contributions.map((c) => ({
      ...c,
      dateObj: new Date(c.date + "T00:00:00"),
    }));

    const sorted = [...normalized].sort(
      (a, b) => b.dateObj.getTime() - a.dateObj.getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayContribution = sorted.find(
      (c) => c.dateObj.getTime() === today.getTime()
    );
    const yesterdayContribution = sorted.find(
      (c) => c.dateObj.getTime() === yesterday.getTime()
    );

    if (todayContribution && todayContribution.total > 0) {
      currentStreakCount = 1;
      let prevDate = new Date(today);

      for (const c of sorted) {
        if (c.dateObj.getTime() === today.getTime()) continue;
        prevDate.setDate(prevDate.getDate() - 1);

        if (c.dateObj.getTime() === prevDate.getTime() && c.total > 0) {
          currentStreakCount++;
        } else if (c.dateObj.getTime() < prevDate.getTime()) {
          break;
        }
      }
    } else if (yesterdayContribution && yesterdayContribution.total > 0) {
      currentStreakCount = 1;
      let prevDate = new Date(yesterday);

      for (const c of sorted) {
        if (c.dateObj.getTime() === yesterday.getTime()) continue;
        prevDate.setDate(prevDate.getDate() - 1);

        if (c.dateObj.getTime() === prevDate.getTime() && c.total > 0) {
          currentStreakCount++;
        } else if (c.dateObj.getTime() < prevDate.getTime()) {
          break;
        }
      }
    }
    const chronological = [...normalized].sort(
      (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
    );

    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const c of chronological) {
      if (c.total > 0) {
        if (prevDate) {
          const expected = new Date(prevDate);
          expected.setDate(expected.getDate() + 1);
          if (c.dateObj.getTime() === expected.getTime()) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        prevDate = c.dateObj;
        longestStreakCount = Math.max(longestStreakCount, tempStreak);
      }
    }

    setCurrentStreak(currentStreakCount);
    setLongestStreak(longestStreakCount);
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

    switch (primaryDifficulty) {
      case "easy":
        return [
          "bg-green-200",
          "bg-green-300",
          "bg-green-400",
          "bg-green-500",
          "bg-green-600",
        ][intensity - 1];
      case "medium":
        return [
          "bg-blue-200",
          "bg-blue-300",
          "bg-blue-400",
          "bg-blue-500",
          "bg-blue-600",
        ][intensity - 1];
      case "hard":
        return [
          "bg-purple-200",
          "bg-purple-300",
          "bg-purple-400",
          "bg-purple-500",
          "bg-purple-600",
        ][intensity - 1];
      default:
        return "bg-green-400";
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

  const getMonthLabels = () => {
    const labels: string[] = [];
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

    selectedYear === new Date().getFullYear();

    const today = new Date();
    const isCurrentYear = selectedYear === today.getFullYear();
    const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31);
    const endWeek = endOfWeek(endDate, 0);
    const startWeek = addWeeks(startOfWeek(endWeek, 0), -51);

    let prevMonth = -1;
    for (let w = 0; w < 52; w++) {
      const weekStart = addDays(startWeek, w * 7);
      const month = weekStart.getMonth();
      if (month !== prevMonth) {
        labels.push(monthNames[month]);
        prevMonth = month;
      } else {
        labels.push("");
      }
    }
    return labels;
  };
  if (loading || !supabase) {
    return (
      <Card className="bg-black/70 border-none text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-white" /> Quest Contribution Graph
          </CardTitle>
          <CardDescription className="text-white">
            {!supabase ? "Initializing..." : "Loading your quest activity..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid [grid-template-columns:repeat(52,minmax(0,1fr))] gap-1 h-32 bg-white/10 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/70 border-none text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="h-5 w-5 text-white" /> Quest Contribution Graph
        </CardTitle>
        <CardDescription className="text-white">
          {totalQuests} quests completed in the last year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Year Selector */}
          <div className="flex flex-wrap md:justify-end gap-2 text-xs justify-center">
            {[0, 1, 2].map((offset) => {
              const year = new Date().getFullYear() - offset;
              const isActive = selectedYear === year;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={
                    isActive
                      ? "px-3 py-1 rounded bg-white/10 text-white"
                      : "px-3 py-1 rounded text-white/70 hover:bg-white/10"
                  }
                >
                  {year}
                </button>
              );
            })}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {currentStreak}
              </div>
              <div className="text-white">Current Streak</div>
              {currentStreak > 0 && (
                <div className="text-xs text-green-500 mt-1">
                  🔥 {currentStreak} day{currentStreak > 1 ? "s" : ""} strong!
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {longestStreak}
              </div>
              <div className="text-white">Longest Streak</div>
              {longestStreak > 0 && (
                <div className="text-xs text-blue-500 mt-1">
                  🏆 Personal best!
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalQuests}
              </div>
              <div className="text-white">Total Quests</div>
              {totalQuests > 0 && (
                <div className="text-xs text-purple-500 mt-1">
                  ⭐ Great progress!
                </div>
              )}
            </div>
          </div>
          {/* Contribution Graph */}
          <div className="space-y-2 pb-4">
            {/* Month Labels (hidden on mobile) */}
            <div
              className="hidden sm:grid text-[10px] text-white w-full"
              style={{
                gridTemplateColumns: `repeat(52, 1fr)`, // evenly divide full width
              }}
            >
              {getMonthLabels().map((month, index) => (
                <div key={index} className="text-center">
                  {month}
                </div>
              ))}
            </div>

            {/* Heatmap Blocks */}
            <div
              className="grid grid-rows-7 grid-flow-col w-full"
              style={{
                gridTemplateColumns: `repeat(52, 1fr)`, // evenly fill width
                gap: "2px", // consistent spacing
              }}
            >
              {contributions.map((contribution) => {
                const isToday =
                  contribution.date === new Date().toISOString().split("T")[0];

                return (
                  <div
                    key={contribution.date}
                    className={`aspect-square rounded-[2px] cursor-pointer 
            transition-transform hover:scale-110
            ${getContributionColor(contribution)} 
            ${
              isToday
                ? "ring-1 ring-white ring-offset-[0.5px] sm:ring-2 sm:ring-offset-1 ring-offset-black"
                : ""
            }
`}
                    title={`${contribution.date}: ${getTooltipContent(contribution)}${
                      isToday ? " (Today)" : ""
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Legends */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-white mt-2 gap-2">
            <div className="flex items-center gap-1 justify-center sm:justify-start">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white/10 rounded-sm"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-200 rounded-sm"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-300 rounded-sm"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-sm"></div>
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-sm"></div>
              </div>
              <span>More</span>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-end gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-sm"></div>
                <span>Easy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-sm"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-sm"></div>
                <span>Hard</span>
              </div>
            </div>
          </div>

          {/* Call to Action (only for current year) */}
          {selectedYear === new Date().getFullYear() && totalQuests === 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-center space-y-2">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Start Your Quest Journey!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
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
              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    Keep Your Streak Alive!
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
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
        </div>
      </CardContent>
    </Card>
  );
}
