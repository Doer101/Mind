import DashboardNavbar from "@/components/dashboard-navbar";
import {
  InfoIcon,
  UserCircle,
  BookOpen,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Welcome to MindMuse</h1>
            <p className="text-muted-foreground">
              Your daily mindfulness and creativity companion
            </p>
          </header>

          {/* User Profile Section */}
          <section className="bg-card rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-primary" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 overflow-hidden mb-4">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Daily Prompt */}
            <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="text-teal-600" />
                <h3 className="font-semibold text-lg">Daily Prompt</h3>
              </div>
              <p className="text-muted-foreground">
                Explore today's mindfulness prompt and record your thoughts.
              </p>
              <Button className="mt-auto bg-teal-600 hover:bg-teal-700">
                View Today's Prompt
              </Button>
            </div>

            {/* Idea Vault */}
            <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Lightbulb className="text-amber-500" />
                <h3 className="font-semibold text-lg">Idea Vault</h3>
              </div>
              <p className="text-muted-foreground">
                Store and organize your creative ideas and inspirations.
              </p>
              <Button
                variant="outline"
                className="mt-auto border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                Open Idea Vault
              </Button>
            </div>

            {/* AI Assistant */}
            <div className="bg-card rounded-xl p-6 border shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-indigo-600" />
                <h3 className="font-semibold text-lg">MuseBot</h3>
              </div>
              <p className="text-muted-foreground">
                Chat with our AI assistant for mindfulness guidance and tips.
              </p>
              <Button
                variant="outline"
                className="mt-auto border-indigo-500 text-indigo-700 hover:bg-indigo-50"
              >
                Chat with MuseBot
              </Button>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
