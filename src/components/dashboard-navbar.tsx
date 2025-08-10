"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { UserCircle, Home, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const [userXP, setUserXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextXP, setNextXP] = useState(100);

  useEffect(() => {
    async function fetchXP() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Fetch user_xp
      const { data: userData } = await supabase
        .from("users")
        .select("user_xp")
        .eq("id", user.id)
        .single();
      const xp = userData?.user_xp || 0;
      setUserXP(xp);
      // Fetch level info
      const { data: levels } = await supabase
        .from("user_levels")
        .select("level,xp_required")
        .order("level", { ascending: true });
      if (levels && levels.length > 0) {
        let currentLevel = 1;
        let nextLevelXP = 100;
        for (let i = 0; i < levels.length; i++) {
          if (xp >= levels[i].xp_required) {
            currentLevel = levels[i].level;
            nextLevelXP = levels[i + 1]?.xp_required || levels[i].xp_required;
          } else {
            break;
          }
        }
        setLevel(currentLevel);
        setNextXP(nextLevelXP);
      }
    }
    fetchXP();
  }, []);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            prefetch
            className="text-xl font-bold flex items-center"
          >
            <Sparkles className="w-6 h-6 text-teal-600 mr-2" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-indigo-500">
              Quenalty
            </span>
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
