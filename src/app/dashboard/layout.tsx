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
  Menu,
  X,
  Trophy,
  ListTodo,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/dashboard/journal",
      label: "Journal",
      icon: BookOpen,
    },
    {
      href: "/dashboard/quests",
      label: "Daily Quests",
      icon: Trophy,
    },
    {
      href: "/dashboard/chat",
      label: "AI Chat",
      icon: MessageCircle,
    },
    {
      href: "/dashboard/feedback",
      label: "Writing Feedback",
      icon: MessageSquare,
    },
    {
      href: "/dashboard/mirror",
      label: "Creativity Mirror",
      icon: Lightbulb,
    },
    {
      href: "/todo-feature",
      label: "To-Do List",
      icon: ListTodo,
    },
  ];

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-white transition-opacity hover:opacity-80 group"
        >
          <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg">Quenalty</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-6">
        <nav className="space-y-1">
          {routes.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Button
                key={route.href}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 h-11 px-3 relative group",
                  isActive && "bg-white/10 text-white font-medium"
                )}
                asChild
              >
                <Link
                  href={route.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                  
                  <div className={cn(
                    "p-1.5 rounded-lg mr-3 transition-colors",
                    isActive ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <route.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{route.label}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Settings Section */}
      <div className="border-t border-white/10 p-3">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 h-11 px-3 group",
            pathname === "/dashboard/settings" && "bg-white/10 text-white font-medium"
          )}
          asChild
        >
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center"
          >
            <div className={cn(
              "p-1.5 rounded-lg mr-3 transition-colors",
              pathname === "/dashboard/settings" ? "bg-white/15" : "bg-white/5 group-hover:bg-white/10"
            )}>
              <Settings className="h-4 w-4" />
            </div>
            <span className="text-sm">Settings</span>
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-black text-white overflow-x-clip">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 w-64 border-r border-white/10 bg-black/50 backdrop-blur-md">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="flex h-14 items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5 text-white" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-black/50 backdrop-blur-md text-white border-white/10">
              <SheetHeader>
                <SheetTitle asChild>
                  <VisuallyHidden>Navigation Menu</VisuallyHidden>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
          <div className="ml-4 flex items-center gap-2 font-semibold text-white">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white">Quenalty</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 overflow-x-clip">
        <div className="h-full pt-14 md:pt-0">{children}</div>
      </div>
    </div>
  );
}
