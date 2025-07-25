"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";

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
}

export function QuestSystem({ userId, apiUrl }: QuestSystemProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [penaltyQuests, setPenaltyQuests] = useState<Quest[]>([]);
  const [userProgress, setUserProgress] = useState<
    Record<string, UserProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchQuests();
    fetchUserProgress();
  }, []);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(apiUrl);
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
      const response = await fetch("/api/quests/progress");
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
    try {
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
      await fetchUserProgress();
    } catch (err) {
      console.error("Error updating quest progress:", err);
      toast({
        title: "Error",
        description: "Failed to update quest progress. Please try again.",
        variant: "destructive",
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (info) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">All Quests Completed!</h2>
          <p className="text-muted-foreground">{info}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchQuests} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no quests or penalty quests exist
  if (quests.length === 0 && penaltyQuests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Active Quests Yet!</h2>
          <p className="text-muted-foreground mb-4">
            No Active quest quests. Click below to get your daily quests!
          </p>
          <Button onClick={generateQuests} variant="default">
            Generate Daily Quests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Daily Quests</h1>
        <Button onClick={generateQuests} variant="outline">
          Get New
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const progress = userProgress[quest.id]?.progress || 0;
          const isCompleted = userProgress[quest.id]?.completed || false;

          return (
            <Card key={quest.id} className={isCompleted ? "opacity-75" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{quest.title}</CardTitle>
                    <CardDescription>{quest.description}</CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(quest.difficulty)}>
                    {quest.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="flex justify-between text-sm">
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
                    className="w-full"
                  >
                    Update Progress
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
                  className={isCompleted ? "opacity-75" : ""}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{quest.title}</CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(quest.difficulty)}>
                        {quest.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                      <div className="flex justify-between text-sm">
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
                        className="w-full"
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
