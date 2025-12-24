"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";
import RippleLoader from "./ui/rippleLoader";

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  xp_reward: number;
  type: "daily" | "weekly" | "achievement" | "penalty";
  status: "active" | "completed";
  created_at: string;
  deadline?: string;
  penalty_for_quest_id?: string;
}

interface UserProgress {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

interface QuestSystemProps {
  userId: string;
  apiUrl: string;
  allowGeneration?: boolean;
  variant?: "default" | "lesson";
}

export function QuestSystem({ userId, apiUrl, allowGeneration = true, variant = "default" }: QuestSystemProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [penaltyQuests, setPenaltyQuests] = useState<Quest[]>([]);
  const [userProgress, setUserProgress] = useState<
    Record<string, UserProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [completingQuests, setCompletingQuests] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    console.log("[QuestSystem] Fetching quests from:", apiUrl);
    fetchQuests();
    fetchUserProgress();
  }, [apiUrl, userId]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error("Failed to fetch quests");
      }

      const data = await response.json();
      setQuests(data.dailyQuests || []);
      setPenaltyQuests(data.penaltyQuests || []);
    } catch (err) {
      setError("Failed to load quests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const generateResponse = await fetch(apiUrl, { method: "POST" });
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        if (
          generateResponse.status === 400 &&
          errorData.error?.includes("daily quest limit")
        ) {
          setInfo(
            "You have reached the daily quest limit (9) for today. Come back tomorrow for new quests!"
          );
          setError(null);
          return;
        }
        throw new Error(errorData.error || "Failed to generate quests");
      }

      const generatedData = await generateResponse.json();
      setQuests(generatedData.quests || []);
      toast({
        title: "New Quests Generated!",
        description: "Your daily quests are ready.",
      });
      fetchQuests();
    } catch (err) {
      setError("Failed to generate quests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch("/api/quests/progress", { cache: 'no-store' });
      if (!response.ok) {
        throw new Error("Failed to fetch user progress");
      }
      const data = await response.json();
      // Transform the progress data into a record for easy lookup
      const progressMap: Record<string, UserProgress> = {};
      if (Array.isArray(data.progress)) {
        data.progress.forEach((item: UserProgress) => {
          progressMap[item.quest_id] = item;
        });
      }
      setUserProgress(progressMap);
    } catch (err) {
      console.error("Error fetching user progress:", err);
      toast({
        title: "Error",
        description: "Could not load your progress. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const updateQuestProgress = async (questId: string, progress: number) => {
    // Prevent duplicate submissions
    if (completingQuests.has(questId)) {
      console.log(`Quest ${questId} is already being completed, ignoring duplicate click`);
      return;
    }

    try {
      // Mark quest as being completed
      setCompletingQuests(prev => new Set(prev).add(questId));

      const response = await fetch("/api/quests/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quest_id: questId, progress }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update quest progress");
      }

      const data = await response.json();
      
      // If already completed (idempotent response), just refresh UI
      if (data.alreadyCompleted) {
        console.log(`Quest ${questId} was already completed`);
      }

      await fetchUserProgress();
      router.refresh();
    } catch (err) {
      console.error("Error updating quest progress:", err);
      toast({
        title: "Error",
        description: "Failed to update quest progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove quest from completing set
      setCompletingQuests(prev => {
        const next = new Set(prev);
        next.delete(questId);
        return next;
      });
    }
  };

  const getDifficultyColor = (difficulty: Quest["difficulty"]) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black bg-opacity-70 text-white">
        <RippleLoader icon={<Trophy />} size={200} duration={2} logoColor="white" />
      </div>
    );
  }

  if (info) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black bg-opacity-70 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">All Quests Completed!</h2>
          <p className="text-white">{info}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black bg-opacity-70 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-white">{error}</p>
          <Button
            onClick={fetchQuests}
            className="mt-4 border border-white text-white hover:bg-white hover:text-black"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no quests or penalty quests exist
  if (quests.length === 0 && penaltyQuests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-black bg-opacity-70 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Quests Yet!</h2>
          <p className="text-white mb-4">
            No Active quest quests. {allowGeneration && "Click below to get your daily quests!"}
          </p>
          {allowGeneration && (
            <Button
              onClick={generateQuests}
              variant="default"
              className="border border-white text-black bg-white hover:bg-black hover:text-white"
            >
              Generate Daily Quests
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-black bg-opacity-70 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daily Quests</h1>
        {allowGeneration && (
          <Button
            onClick={generateQuests}
            variant="outline"
            className="border border-white bg-black/70 text-white hover:bg-white hover:text-black"
          >
            Get New
          </Button>
        )}
      </div>

      <div className={variant === "lesson" ? "space-y-4" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3"}>
        {quests.map((quest, index) => {
          const progress = userProgress[quest.id]?.progress || 0;
          const isCompleted = userProgress[quest.id]?.completed || false;

          if (variant === "lesson") {
             return (
               <Card 
                 key={quest.id} 
                 className={`border-l-4 transition-all ${
                   isCompleted 
                     ? "border-l-green-500 bg-zinc-900/50 border-y-white/5 border-r-white/5 opacity-70" 
                     : "border-l-teal-500 bg-zinc-900 border-white/10"
                 }`}
               >
                 <CardContent className="p-6 flex gap-6 items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${
                      isCompleted ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-teal-500/20 text-teal-400 border-teal-500/30"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className={`text-xl font-bold ${isCompleted ? "text-white/60 line-through" : "text-white"}`}>
                              {quest.title}
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest text-teal-500/60 font-bold flex items-center gap-1">
                              Reward: <span className="text-teal-400">{quest.xp_reward} XP</span>
                            </p>
                          </div>
                          {isCompleted && <Badge className="bg-green-500/20 text-green-400 border-none">Completed</Badge>}
                       </div>
                       <p className="text-white/80 leading-relaxed text-base">
                         {quest.description}
                       </p>
                    </div>
                    <div className="flex-shrink-0 self-center">
                      {!isCompleted ? (
                        <Button
                          onClick={() => updateQuestProgress(quest.id, 100)}
                          disabled={completingQuests.has(quest.id)}
                          className="bg-white text-black hover:bg-white/90 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {completingQuests.has(quest.id) ? "Completing..." : "Complete"}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          disabled
                          className="text-green-400 font-bold opacity-100"
                        >
                          Done
                        </Button>
                      )}
                    </div>
                 </CardContent>
               </Card>
             );
          }

          return (
            <Card
              key={quest.id}
              className={
                isCompleted
                  ? "opacity-75 bg-black bg-opacity-70 border-none text-white"
                  : "bg-black bg-opacity-70 border-none text-white"
              }
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-white">{quest.title}</CardTitle>
                    <CardDescription className="text-white">
                      {quest.description}
                    </CardDescription>
                    <div className="flex gap-2">
                       <Badge
                        className={
                          getDifficultyColor(quest.difficulty) + " text-white"
                        }
                      >
                        {quest.difficulty}
                      </Badge>
                      {(quest as any).quest_category === 'core' ? (
                        <Badge className="bg-gradient-to-r from-teal-500 to-indigo-500 text-white border-none shadow-[0_0_15px_rgba(20,184,166,0.2)]">Mandatory Core Quest</Badge>
                      ) : (
                        <Badge variant="outline" className="text-white/40 border-white/20">Optional Side Quest</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-white">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex justify-between text-sm text-white">
                    <span>XP Reward</span>
                    <span>{quest.xp_reward} XP</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {!isCompleted && (
                  <Button
                    onClick={() =>
                      updateQuestProgress(
                        quest.id,
                        Math.min(progress + 50, 100)
                      )
                    }
                    disabled={completingQuests.has(quest.id)}
                    className="w-full border border-white text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completingQuests.has(quest.id) ? "Updating..." : "Update Progress"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Penalty Quests Section */}
      {penaltyQuests.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4 text-red-600">
            Penalty Quests ({penaltyQuests.length})
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {penaltyQuests.map((quest) => {
              const progress = userProgress[quest.id]?.progress || 0;
              const isCompleted = userProgress[quest.id]?.completed || false;
              return (
                <Card
                  key={quest.id}
                  className={
                    isCompleted
                      ? "opacity-75 bg-black bg-opacity-70 border-none text-white"
                      : "bg-black bg-opacity-70 border-none text-white"
                  }
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">
                          {quest.title}
                        </CardTitle>
                        <CardDescription className="text-white">
                          {quest.description}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          getDifficultyColor(quest.difficulty) + " text-white"
                        }
                      >
                        {quest.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm text-white">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                      <div className="flex justify-between text-sm text-white">
                        <span>XP Reward</span>
                        <span>{quest.xp_reward} XP</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    {!isCompleted && (
                      <Button
                        onClick={() =>
                          updateQuestProgress(
                            quest.id,
                            Math.min(progress + 50, 100)
                          )
                        }
                        className="w-full border border-white text-white hover:bg-white hover:text-black"
                      >
                        Update Progress
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Debug section - show penalty quests count even if 0 
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Debug: Penalty quests count: {penaltyQuests.length}</p>
        <p>Debug: Daily quests count: {quests.length}</p>
      </div>
      */}
    </div>
  );
}
