"use client";

import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/auth-context";
import { Card } from "@/components/ui/card";
import { Heatmap } from "@/components/ui/heatmap";

// 🎨 Function to scale colors based on learning time
const colorScale = (value: number) => {
  if (value <= 1800) return "#e5e7eb"; // Light gray for ≤ 30 min
  if (value <= 3600) return "#bfdbfe"; // Light blue for ≤ 1 hour
  if (value <= 7200) return "#60a5fa"; // Medium blue for ≤ 2 hours
  if (value <= 14400) return "#2563eb"; // Dark blue for ≤ 4 hours
  return "#1e40af"; // Deep blue for > 4 hours
};

// ⏳ Function to format seconds into HH:mm:ss
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

export function LearningGraph() {
  const { user } = useAuth();
  const [data, setData] = useState<{ date: string; time: number }[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchLearningData = async () => {
      try {
        const response = await fetch(`/api/weeklyProgressTime?userId=${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch learning data");

        const result = await response.json();
        console.log("📅 Fetched Learning Data:", result); // Debugging log

        setData(result);
      } catch (error) {
        console.error("❌ Error fetching learning data:", error);
      }
    };

    fetchLearningData();
  }, [user?.id]);

  // 📝 Manually added data points (for testing)
  const manualEntries = [
    { date: "2024-03-10", value: 3600 }, // 1 hour
    { date: "2024-03-15", value: 7200 }, // 2 hours
  ];

  // 🔥 Combine API data with manual data and format correctly for Heatmap
  const heatmapData = [
    ...data.map((entry) => ({
      date: entry.date.split("T")[0], // Extracts YYYY-MM-DD
      value: entry.time, // Keeps time in seconds
    })),
    ...manualEntries,
  ];

  // 📊 Sort and prepare data for LineChart (Last 7 Days)
  const sortedLineData = useMemo(
    () =>
      [...data]
        .reverse()
        .slice(0, 7) // Last 7 entries
        .map((entry) => ({
          ...entry,
          formattedTime: formatTime(entry.time),
        })),
    [data]
  );

  return (
    <Card className="p-6 bg-black text-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-center">Yearly Learning Calendar</h3>
      
      {/* 📌 Heatmap Section */}
      <ResponsiveContainer width="100%" height={250}>
      <Heatmap
  data={heatmapData}
  colors={["#e5e7eb", "#bfdbfe", "#60a5fa", "#2563eb", "#1e40af"]}
  tooltipFormatter={(value) => formatTime(value)}
  className="rounded-lg"
  classForValue={(value) => {
    if (!value || typeof value.value !== "number") return "fill-[#e5e7eb]";
    return `fill-[${colorScale(value.value)}]`;
  }}
/>
      </ResponsiveContainer>

      {/* 📊 Line Chart Section */}
      <h3 className="text-xl font-semibold mt-8 mb-4 text-center">Last 7 Days Learning Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sortedLineData}>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => formatTime(val as number)} />
          <Tooltip
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              return (
                <div className="bg-white p-2 shadow rounded-md">
                  <p className="text-sm font-semibold">{payload[0].payload.date}</p>
                  <p className="text-sm text-purple-700">Time Spent: {payload[0].payload.formattedTime}</p>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="time" stroke="#2563eb" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
