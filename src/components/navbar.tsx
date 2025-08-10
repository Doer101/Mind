"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import { Button } from "./ui/button";
import { Sparkles, UserCircle } from "lucide-react";
import UserProfile from "./user-profile";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/20 bg-transparent backdrop-blur supports-[backdrop-filter]:bg-black/20">
      <div className="container flex h-14 items-center">
        <Link href="/" prefetch className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="font-bold text-lg text-white">Quenalty</span>
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {loading ? (
            <div className="w-8 h-8 animate-pulse bg-gray-300 rounded"></div>
          ) : user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:text-black"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserProfile />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:text-black"
                asChild
              >
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button
                size="sm"
                className="bg-white text-black hover:bg-black hover:text-white border border-white"
                asChild
              >
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
