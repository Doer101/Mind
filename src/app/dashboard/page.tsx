import DashboardCalendarTodo from "./dashboard-calendar-todo";
import {
  InfoIcon,
  UserCircle,
  Brain,
  PenTool,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import AIFeatures from "@/components/ai-features";
import DashboardQuestStats from "@/components/dashboard-quest-stats";
import QuestContributionGraph from "@/components/quest-contribution-graph";


export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch today's journal entries
  const today = new Date().toISOString().split("T")[0];
  const { data: journalEntries, error: journalError } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today)
    .order("created_at", { ascending: false });

  // Fetch today's prompts
  const { data: prompts, error: promptError } = await supabase
    .from("daily_prompts")
    .select("*")
    .eq("user_id", user.id)
    .gte("created_at", today)
    .order("created_at", { ascending: false });

  // Fetch total journal entries
  const { count: totalEntries } = await supabase
    .from("journal_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch user XP
  const { data: userData } = await supabase
    .from("users")
    .select("user_xp, quest_preference")
    .eq("id", user.id)
    .single();
  const userXP = userData?.user_xp || 0;
  const questPreference = userData?.quest_preference || [];

  // If no quest preference, show a message with a link to settings
  if (!questPreference || questPreference.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 bg-black text-white">
        <h2 className="text-2xl font-bold mb-4">Set Your Quest Preferences</h2>
        <p className="mb-4 text-white text-center">
          You haven't selected your preferred quest types yet. Please visit the
          settings page to choose the types of quests you want to receive.
        </p>
        <a
          href="/dashboard/settings"
          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
        >
          Go to Settings
        </a>
      </div>
    );
  }

  // Fetch user levels
  const { data: levels } = await supabase
    .from("user_levels")
    .select("level,xp_required")
    .order("level", { ascending: true });
  let level = 1;
  let nextXP = 100;
  if (levels && levels.length > 0) {
    for (let i = 0; i < levels.length; i++) {
      if (userXP >= levels[i].xp_required) {
        level = levels[i].level;
        nextXP = levels[i + 1]?.xp_required || levels[i].xp_required;
      } else {
        break;
      }
    }
  }

  return (
    // Change the main dashboard container line to:
<div className="flex-1 space-y-8 p-8 pt-6 bg-black text-white min-h-screen overflow-x-clip">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-white">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
          </p>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* User Profile Card */}
        <Card className="col-span-1 !bg-black/70 !border-none !text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <UserCircle className="h-5 w-5 text-white" />
              Profile
            </CardTitle>
            <CardDescription className="text-white">
              Your Quenalty account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-sm text-white font-medium">
                  {totalEntries} Journal Entries
                </p>
                <p className="text-sm text-white font-semibold mt-1">
                  Level {level} (XP: {userXP}/{nextXP})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Stats Card */}
        <Card className="col-span-1 !bg-black/70 !border-none !text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Brain className="h-5 w-5 text-white" />
              Today's Progress
            </CardTitle>
            <CardDescription className="text-white">
              Your mindfulness journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Daily Prompt</span>
                <span className="text-sm text-white font-medium">
                  {prompts?.length ? "Completed" : "Not Started"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Journal Entry</span>
                <span className="text-sm text-white font-medium">
                  {journalEntries?.length || 0} entries today
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="col-span-1 !bg-black/70 !border-none !text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageCircle className="h-5 w-5 text-white" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-white">
              Start your mindfulness practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border border-white bg-black text-white hover:bg-black hover:text-white"
                asChild
              >
                <a href="/dashboard/journal/new">
                  <PenTool className="mr-2 h-4 w-4 text-white" />
                  Write in Journal
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border border-white bg-black text-white hover:bg-black hover:text-white"
                asChild
              >
                <a href="/dashboard/chat">
                  <MessageCircle className="mr-2 h-4 w-4 text-white" />
                  Chat with AI
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <DashboardQuestStats />

      {/* Quest Contribution Graph */}
      <QuestContributionGraph userId={user.id} />

      {/* AI Features Section */}
      <div className="space-y-4">
        <div className="grid gap-4">
          {/* Only show the daily prompt generation if the user has not generated today's prompt */}
          {(!prompts || prompts.length === 0) && (
            <AIFeatures
              type="daily-prompt"
              title="Daily Prompt"
              description="Get a new creative writing prompt each day to spark your imagination."
              icon={<PenTool className="h-5 w-5 text-white" />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
