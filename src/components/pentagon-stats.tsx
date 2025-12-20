"use client";
// Pentagon (Radar) chart visualization for field mastery

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface PentagonStatsProps {
  data: {
    name: string;
    level: number;
    unlocked: boolean;
  }[];
  maxLevel: number;
}

export function PentagonStats({ data, maxLevel }: PentagonStatsProps) {
  // Normalize data for the chart
  const chartData = data.map((field) => ({
    subject: field.name,
    value: field.unlocked ? (field.level / maxLevel) * 100 : 0,
    fullMark: 100,
  }));

  // Ensure we have at least 3 points for a radar chart to look good, or handle empty states
  if (chartData.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-white/10 h-[300px] flex flex-col items-center justify-center space-y-4 rounded-3xl backdrop-blur-xl">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
          <BarChart3 className="h-8 w-8 text-white/20" />
        </div>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest italic">Insufficient Field Data</p>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/40 border-white/10 overflow-hidden backdrop-blur-xl rounded-3xl">
      <CardContent className="p-0">
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 11, fontWeight: 800 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#2dd4bf"
                strokeWidth={3}
                fill="#14b8a6"
                fillOpacity={0.4}
                className="drop-shadow-[0_0_8px_rgba(20,184,166,0.8)]"
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-5 border-t border-white/5 bg-black/40">
          <p className="text-[10px] text-center text-white/60 uppercase tracking-widest font-black italic">
            Mastery Blueprint • Normalized Analysis
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
