"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LeagueCountdown() {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    function calculateTimeLeft() {
      const now = new Date();
      // Target is next Monday 00:00:00 UTC
      const nextMonday = new Date();
      nextMonday.setUTCHours(0, 0, 0, 0);
      
      // Calculate days until next Monday (1)
      // now.getUTCDay() returns 0 (Sun), 1 (Mon), ..., 6 (Sat)
      const day = now.getUTCDay();
      const diff = (8 - day) % 7 || 7;
      
      nextMonday.setUTCDate(now.getUTCDate() + diff);

      const ms = nextMonday.getTime() - now.getTime();
      
      const d = Math.floor(ms / (1000 * 60 * 60 * 24));
      const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

      return `${d}d ${h}h ${m}m`;
    }

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-2 text-teal-400 text-sm font-black uppercase tracking-widest bg-teal-500/10 px-4 py-1.5 rounded-full border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
      <Clock className="h-4 w-4 animate-pulse" />
      <span>Resets in {timeLeft}</span>
    </div>
  );
}
