"use client";

import { ResponsiveContainer } from "recharts";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { Tooltip } from "react-tooltip";

interface HeatmapProps {
  data: { date: string; value: number }[];
  colors?: string[];
  tooltipFormatter?: (value: number) => string;
  className?: string;
}

// 🎨 Define color mapping based on value ranges (Minutes)
const defaultColors = ["#e5e7eb", "#bfdbfe", "#60a5fa", "#2563eb", "#1e40af"];

const colorScale = (value: number, colors: string[]) => {
  if (value === 0) return colors[0]; // Light Gray (No Data)
  if (value < 2) return colors[1]; // Light Blue (Less than 2 min)
  if (value < 15) return colors[2]; // Medium Blue (2 - 14 min)
  if (value < 120) return colors[3]; // Dark Blue (15 - 119 min)
  return colors[4]; // Deep Blue (More than 2 hours)
};

// 🗓️ Generate all dates for the past year
const getHeatmapData = (data: { date: string; value: number }[]) => {
  const today = new Date();
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - 1);

  const dateMap = new Map(data.map((entry) => [entry.date, entry.value]));

  const allDates = [];
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    allDates.push({ date: dateStr, value: dateMap.get(dateStr) || 0 });
  }
  return allDates;
};

export function Heatmap({ data, colors = defaultColors, tooltipFormatter, className }: HeatmapProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <CalendarHeatmap
        startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
        endDate={new Date()}
        values={getHeatmapData(data)}
        showWeekdayLabels
        gutterSize={4}
        tooltipDataAttrs={(value: { date: string; value: number }) => ({
          "data-tooltip-id": "heatmap-tooltip",
          "data-tooltip-content": tooltipFormatter
            ? tooltipFormatter(value.value)
            : `${value.value} min`,
        })}
        style={{
          background: "black",
          padding: "10px",
          borderRadius: "8px",
        }}
        renderDay={(value: { date: string; value: number }) => (
          <rect
            width={10}
            height={10}
            fill={colorScale(value.value, colors)} // ✅ Correct inline color
            rx={2}
            ry={2}
          />
        )}
      />
      <Tooltip id="heatmap-tooltip" />
    </ResponsiveContainer>
  );
}
