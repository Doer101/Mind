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
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>MindMuse</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="grid gap-1">
          {routes.map((route) => (
            <Button
              key={route.href}
              variant={pathname === route.href ? "secondary" : "ghost"}
              className={cn(
                "justify-start",
                pathname === route.href && "bg-accent"
              )}
              asChild
            >
              <Link href={route.href} onClick={() => setIsOpen(false)}>
                <route.icon className="mr-2 h-4 w-4" />
                {route.label}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/dashboard/settings" onClick={() => setIsOpen(false)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarContent />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
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
          <div className="ml-4 flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>MindMuse</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        <div className="h-full pt-14 md:pt-0">{children}</div>
      </div>
    </div>
  );
}
