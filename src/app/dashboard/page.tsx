import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Brain,
  PenTool,
  MessageCircle,
  Eye,
  LightbulbIcon,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import AIFeatures from "@/components/ai-features";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Welcome Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome to MindMuse
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Your daily mindfulness and creativity companion
            </p>
          </section>

          <Separator className="my-6" />

          {/* User Profile Section */}
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-6 w-6 text-primary" />
                User Profile
              </CardTitle>
              <CardDescription>
                Your MindMuse account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    MindMuse Member
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Features Grid */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold tracking-tight">
                AI Features
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Daily Prompt */}
              <AIFeatures
                type="daily-prompt"
                title="Daily Prompt"
                description="Get a new creative writing prompt each day to spark your imagination."
                icon={<PenTool className="h-5 w-5" />}
              />

              {/* AI Feedback */}
              <AIFeatures
                type="feedback"
                title="Writing Feedback"
                description="Get AI-powered feedback on your writing to improve style and clarity."
                icon={<MessageSquare className="h-5 w-5" />}
              />

              {/* MuseBot Chat */}
              <AIFeatures
                type="chat"
                title="MuseBot Chat"
                description="Chat with our AI assistant for creative guidance and inspiration."
                icon={<MessageCircle className="h-5 w-5" />}
              />

              {/* Creativity Mirror */}
              <AIFeatures
                type="mirror"
                title="Creativity Mirror"
                description="Get insights about your creative journey and personal growth."
                icon={<Eye className="h-5 w-5" />}
              />

              {/* Idea Vault */}
              <AIFeatures
                type="idea-expand"
                title="Idea Vault"
                description="Expand your creative ideas with AI-powered suggestions."
                icon={<LightbulbIcon className="h-5 w-5" />}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
