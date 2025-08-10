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
import { Trophy, Calendar, TrendingUp, Plus } from "lucide-react";
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

  // Date helpers for week-aligned ranges (weeks start on Sunday)
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

  // Initialize Supabase client on mount
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
    if (!supabase) {
      console.log("Supabase client not ready yet");
      return;
    }

    try {
      setLoading(true);

      // Compute a week-aligned 52-week window for the selected year
      const today = new Date();
      const isCurrentYear = selectedYear === today.getFullYear();
      const endDate = isCurrentYear ? today : new Date(selectedYear, 11, 31); // Dec 31 of selected year
      const endWeek = endOfWeek(endDate, 0);
      const startWeek = addWeeks(startOfWeek(endWeek, 0), -51); // 52 weeks total

      const dateFromISO = startWeek.toISOString();
      const dateToISO = addDays(endWeek, 1).toISOString(); // inclusive upper bound

      // Try to fetch completed quests with join
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

      // If join fails, try a simpler approach
      if (error) {
        console.log(
          "Join query failed, trying alternative approach:",
          error.message
        );

        // Get completed quest progress
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

        if (progressError) {
          console.error("Progress query also failed:", progressError);
          return;
        }

        // Get quest details for completed quests
        if (progressData && progressData.length > 0) {
          const questIds = progressData.map(
            (p: { completed_at: string; quest_id: string }) => p.quest_id
          );
          const { data: questsData, error: questsError } = (await supabase
            .from("quests")
            .select("id, difficulty, xp_reward")
            .in("id", questIds)) as {
            data:
              | { id: string; difficulty: string; xp_reward: number }[]
              | null;
            error: any;
          };

          if (questsError) {
            console.error("Quests query failed:", questsError);
            return;
          }

          // Combine the data
          completedQuests = progressData
            .map((progress: { completed_at: string; quest_id: string }) => {
              const quest = questsData?.find(
                (q: { id: string; difficulty: string; xp_reward: number }) =>
                  q.id === progress.quest_id
              );
              if (quest) {
                return {
                  completed_at: progress.completed_at,
                  quests: {
                    difficulty: quest.difficulty,
                    xp_reward: quest.xp_reward,
                  } as QuestData,
                } as CompletedQuest;
              }
              return null;
            })
            .filter(
              (item: CompletedQuest | null): item is CompletedQuest =>
                item !== null
            ); // Only include items with quest data

          error = null; // Reset error since we succeeded
        }
      }

      if (error) {
        console.error("Error fetching quests:", error);
        console.error(
          "Error details:",
          error.message,
          error.details,
          error.hint
        );
        return;
      }

      console.log("Fetched completed quests:", completedQuests?.length || 0);

      // Process quests into daily contributions
      const contributionMap = new Map<string, QuestContribution>();

      // Initialize all dates for a fixed 52-week range (7 * 52 = 364 days)
      for (let i = 0; i < 364; i++) {
        const date = addDays(startWeek, i);
        const dateStr = date.toISOString().split("T")[0];
        contributionMap.set(dateStr, {
          date: dateStr,
          easy: 0,
          medium: 0,
          hard: 0,
          total: 0,
        });
      }

      // Count quests by date and difficulty
      completedQuests?.forEach((questProgress: CompletedQuest) => {
        if (questProgress.completed_at && questProgress.quests) {
          const dateStr = questProgress.completed_at.split("T")[0];
          const existing = contributionMap.get(dateStr);

          if (existing) {
            // Determine difficulty based on XP reward
            let difficulty: "easy" | "medium" | "hard";
            if (questProgress.quests.xp_reward <= 8) {
              difficulty = "easy";
            } else if (questProgress.quests.xp_reward <= 15) {
              difficulty = "medium";
            } else {
              difficulty = "hard";
            }

            existing[difficulty]++;
            existing.total++;
            contributionMap.set(dateStr, existing);
          }
        }
      });

      // Convert to array and sort by date
      const contributionsArray = Array.from(contributionMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setContributions(contributionsArray);
      setTotalQuests(completedQuests?.length || 0);

      // Calculate streaks
      calculateStreaks(contributionsArray);

      console.log("Processed contributions:", contributionsArray.length);
      console.log("Total quests found:", completedQuests?.length || 0);
    } catch (error) {
      console.error("Error processing quest contributions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreaks = (contributions: QuestContribution[]) => {
    let currentStreakCount = 0;
    let longestStreakCount = 0;
    let tempStreak = 0;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate current streak (consecutive days with quests up to today)
    for (let i = contributions.length - 1; i >= 0; i--) {
      const contribution = contributions[i];
      const contributionDate = new Date(contribution.date);
      const daysDiff = Math.floor(
        (today.getTime() - contributionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= currentStreakCount && contribution.total > 0) {
        currentStreakCount++;
      } else if (contribution.total > 0) {
        break;
      }
    }

    // Calculate longest streak
    for (const contribution of contributions) {
      if (contribution.total > 0) {
        tempStreak++;
        longestStreakCount = Math.max(longestStreakCount, tempStreak);
      } else {
        tempStreak = 0;
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
        if (intensity === 1) return "bg-green-200";
        if (intensity === 2) return "bg-green-300";
        if (intensity === 3) return "bg-green-400";
        if (intensity === 4) return "bg-green-500";
        return "bg-green-600";
      case "medium":
        if (intensity === 1) return "bg-blue-200";
        if (intensity === 2) return "bg-blue-300";
        if (intensity === 3) return "bg-blue-400";
        if (intensity === 4) return "bg-blue-500";
        return "bg-blue-600";
      case "hard":
        if (intensity === 1) return "bg-purple-200";
        if (intensity === 2) return "bg-purple-300";
        if (intensity === 3) return "bg-purple-400";
        if (intensity === 4) return "bg-purple-500";
        return "bg-purple-600";
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

    return `${contribution.total} quest${contribution.total > 1 ? "s" : ""} completed (${parts.join(", ")})`;
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
            <Trophy className="h-5 w-5 text-white" />
            Quest Contribution Graph
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
          <Trophy className="h-5 w-5 text-white" />
          Quest Contribution Graph
        </CardTitle>
        <CardDescription className="text-white">
          {totalQuests} quests completed in the last year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Year Selector */}
          <div className="flex items-center justify-end gap-2 text-xs">
            {[0, 1, 2].map((offset) => {
              const year = new Date().getFullYear() - offset;
              const isActive = selectedYear === year;
              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={
                    isActive
                      ? "px-2 py-1 rounded bg-white/10 text-white"
                      : "px-2 py-1 rounded text-white/70 hover:bg-white/10"
                  }
                >
                  {year}
                </button>
              );
            })}
          </div>
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 text-sm">
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
          <div className="space-y-2">
            {/* Month Labels */}
            <div className="grid [grid-template-columns:repeat(52,minmax(0,1fr))] gap-1 text-[10px] text-white">
              {getMonthLabels().map((month, index) => (
                <div key={index} className="text-center">
                  {month}
                </div>
              ))}
            </div>

            {/* Contribution Grid */}
            <div className="grid [grid-template-columns:repeat(52,minmax(0,1fr))] grid-rows-7 grid-flow-col gap-1">
              {contributions.map((contribution) => (
                <div
                  key={contribution.date}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-colors hover:scale-110 ${getContributionColor(
                    contribution
                  )}`}
                  title={`${contribution.date}: ${getTooltipContent(
                    contribution
                  )}`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-xs text-white">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-white/10 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>More</span>
              </div>
            </div>

            {/* Difficulty Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                <span>Easy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
                <span>Hard</span>
              </div>
            </div>

            {/* Call to Action */}
            {totalQuests === 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-center space-y-2">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Start Your Quest Journey!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Complete your first quest to begin building your
                    contribution streak.
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

            {totalQuests > 0 && currentStreak === 0 && (
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
        </div>
      </CardContent>
    </Card>
  );
}
