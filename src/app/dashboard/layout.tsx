"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Settings,
  MessageCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 border-r bg-background p-4">
        <nav className="grid gap-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname === "/dashboard" ? "bg-accent" : "transparent"
            )}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/dashboard/journal"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/journal")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Journal
          </Link>
          <Link
            href="/dashboard/ideas"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/ideas")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <Lightbulb className="h-4 w-4" />
            Ideas
          </Link>
          <Link
            href="/dashboard/chat"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/chat")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <MessageCircle className="h-4 w-4" />
            AI Chat
          </Link>
          <Link
            href="/dashboard/feedback"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/feedback")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Writing Feedback
          </Link>
          <Link
            href="/dashboard/mirror"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/mirror")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <Sparkles className="h-4 w-4" />
            Creativity Mirror
          </Link>
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              pathname.startsWith("/dashboard/settings")
                ? "bg-accent"
                : "transparent"
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">{children}</div>
    </div>
  );
}
