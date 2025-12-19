"use client";
// Pentagon (Radar) chart visualization for field mastery

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
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
      <Card className="bg-white/5 border-white/10 h-[300px] flex items-center justify-center">
        <p className="text-white/40 text-sm">No data available</p>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10, fontWeight: 700 }}
              />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#14b8a6"
                fill="#14b8a6"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 border-t border-white/5 bg-white/5">
          <p className="text-[10px] text-center text-white/40 uppercase tracking-widest font-black italic">
            Normalized Performance across unlocked fields
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
