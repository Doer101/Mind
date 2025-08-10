"use client";

import { useEffect, useState } from "react";

export default function DashboardQuestStats() {
  const [questStats, setQuestStats] = useState({
    dailyCompleted: 0,
    dailyTotal: 0,
    totalCompleted: 0,
  });

  useEffect(() => {
    async function fetchQuestStats() {
      try {
        const res = await fetch("/api/quests/stats");
        if (res.ok) {
          const data = await res.json();
          setQuestStats(data);
        }
      } catch (e) {
        // ignore
      }
    }
    fetchQuestStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 bg-black text-white">
      <div className="bg-black/70 rounded-lg shadow-none border-none p-6">
        <h3 className="text-lg font-bold mb-2 text-white">
          Daily Quest Completion
        </h3>
        <p className="text-white">
          ({questStats.dailyCompleted}/{questStats.dailyTotal}) quests completed
          today
        </p>
        {questStats.dailyCompleted === 0 && (
          <p className="text-white mt-2">
            You haven't completed any daily quests today. Generate and complete
            quests to start your streak!
          </p>
        )}
      </div>
      <div className="bg-black/70 rounded-lg shadow-none border-none p-6">
        <h3 className="text-lg font-bold mb-2 text-white">
          Total Quest Completion
        </h3>
        <p className="text-white">
          {questStats.totalCompleted} quests completed overall
        </p>
      </div>
    </div>
  );
}
