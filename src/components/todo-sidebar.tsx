import Link from "next/link";
import { Home, BookOpen, Trophy, MessageCircle, MessageSquare, Lightbulb, ListTodo } from "lucide-react";

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

export default function TodoSidebar() {
  return (
    <nav className="grid gap-1">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className="inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 justify-start text-white hover:text-white hover:bg-white/10"
        >
          <route.icon className="mr-2 h-4 w-4 text-white" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
