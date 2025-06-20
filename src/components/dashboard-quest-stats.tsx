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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-2">Daily Quest Completion</h3>
        <p>
          ({questStats.dailyCompleted}/{questStats.dailyTotal}) quests completed
          today
        </p>
        {questStats.dailyCompleted === 0 && (
          <p className="text-black mt-2">
            You haven't completed any daily quests today. Generate and complete
            quests to start your streak!
          </p>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-2">Total Quest Completion</h3>
        <p>{questStats.totalCompleted} quests completed overall</p>
      </div>
    </div>
  );
}
