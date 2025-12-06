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
import WeeklyProgressGraph from "@/components/weekly-progress-graph";

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
    <div className="flex-1 min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section - Simplified */}
      <div className="relative bg-black/70 border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-5" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <p className="text-lg sm:text-xl text-white/70">
                Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 max-w-7xl mx-auto overflow-x-hidden">
        {/* Quick Stats Grid */}
        <div className="grid gap-6 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile Card */}
          <Card className="group relative overflow-hidden border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/15 transition-colors">
                  <UserCircle className="h-5 w-5 text-white" />
                </div>
                Profile
              </CardTitle>
              <CardDescription className="text-white/60">
                Your Quenalty account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/30 transition-all">
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-lg truncate">
                    {profile?.full_name || user.email}
                  </p>
                  <p className="text-sm text-white/70 font-medium mt-1">
                    {totalEntries} Journal Entries
                  </p>
                  <div className="mt-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm inline-block">
                    <p className="text-sm text-white font-semibold">
                      Level {level} • {userXP}/{nextXP} XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Stats Card */}
          <Card className="group relative overflow-hidden border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/15 transition-colors">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                Today's Progress
              </CardTitle>
              <CardDescription className="text-white/60">
                Your mindfulness journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
                  <span className="text-sm text-white/80 font-medium">Daily Prompt</span>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${prompts?.length ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70'}`}>
                    {prompts?.length ? "✓ Completed" : "Not Started"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
                  <span className="text-sm text-white/80 font-medium">Journal Entry</span>
                  <span className="text-xs text-white font-semibold px-3 py-1.5 rounded-full bg-white/10">
                    {journalEntries?.length || 0} {journalEntries?.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="group relative overflow-hidden border border-white/20 bg-black/50 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1 md:col-span-2 lg:col-span-1">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-white text-xl">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm group-hover:bg-white/15 transition-colors">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-white/60">
                Start your mindfulness practice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] group/btn h-auto py-3"
                  asChild
                >
                  <a href="/dashboard/journal">
                    <div className="p-2 rounded-lg bg-white/10 mr-3 group-hover/btn:bg-white/15 transition-colors">
                      <PenTool className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium hover:text-white transition-colors">Write in Journal</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] group/btn h-auto py-3"
                  asChild
                >
                  <a href="/dashboard/chat">
                    <div className="p-2 rounded-lg bg-white/10 mr-3 group-hover/btn:bg-white/15 transition-colors">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium hover:text-white transition-colors">Chat with AI</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Weekly Progress</h2>
          </div>
          <WeeklyProgressGraph />
        </div>

        {/* Quest Stats Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Quest Statistics</h2>
          </div>
          <DashboardQuestStats />
        </div>

        {/* Quest Contribution Graph Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Activity Overview</h2>
          </div>
          <QuestContributionGraph userId={user.id} />
        </div>

        {/* AI Features Section */}
        {(!prompts || prompts.length === 0) && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Daily Inspiration</h2>
            </div>
            <AIFeatures
              type="daily-prompt"
              title="Daily Prompt"
              description="Get a new creative writing prompt each day to spark your imagination."
              icon={<PenTool className="h-5 w-5 text-white" />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
