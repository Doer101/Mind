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
    // {
    //   href: "/dashboard/ideas",
    //   label: "Ideas",
    //   icon: Lightbulb,
    // },
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
  ];

  const SidebarContent = () => (
    <>
      <div className="flex h-14 items-center border-b border-white/20 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-white"
        >
          <Sparkles className="h-5 w-5 text-white" />
          <span className="text-white">Quenalty</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="grid gap-1">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={"ghost"}
              className={cn(
                "justify-start text-white hover:text-white hover:bg-white/10",
                pathname === route.href && "bg-white/10"
              )}
              asChild
            >
              <Link
                href={route.href}
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-white"
              >
                <route.icon className="mr-2 h-4 w-4 text-white" />
                {route.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:text-white hover:bg-white/10"
          asChild
        >
          <Link
            href="/dashboard/settings"
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-white"
          >
            <Settings className="mr-2 h-4 w-4 text-white" />
            Settings
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-black text-white overflow-x-clip">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 w-64 border-r border-white/20 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
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
            <SheetContent side="left" className="p-0 bg-black/70 text-white">
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
