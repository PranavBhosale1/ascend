"use client";

import { useEffect, useState } from "react";
import { Clock, Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface DailyProgress {
  date: string;
  time: number;
}

export function LearningTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const { user } = useAuth();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split("T")[0];

  // Save time to MongoDB
  const saveTimeToDatabase = async (newTime: number) => {
    if (!user?.id) return console.warn("⚠️ User not logged in, skipping MongoDB update.");

    try {
      console.log("📡 Sending updated time to MongoDB:", newTime);
      const response = await fetch("/api/roadmaps/update-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          date: getTodayDate(),
          time: newTime,
        }),
      });

      if (!response.ok) throw new Error("Failed to update MongoDB");
      console.log("✅ Time successfully saved to MongoDB.");
    } catch (error) {
      console.error("❌ Error saving to MongoDB:", error);
    }
  };

  // Load time from MongoDB
  const loadTimeFromDatabase = async () => {
    if (!user?.id) return console.warn("⚠️ User not logged in, skipping MongoDB load.");

    try {
      console.log("📡 Fetching today's time from MongoDB...");
      const response = await fetch(`/api/roadmaps/update-time?userId=${user.id}`);
      const data = await response.json();

      if (data?.learningTime !== undefined) {
        console.log(`✅ Loaded time from MongoDB: ${data.learningTime}`);
        setTime(data.learningTime);
      } else {
        console.log("❌ No entry found for today in MongoDB, starting fresh.");
      }
    } catch (error) {
      console.error("❌ Error loading time from MongoDB:", error);
    }
  };

  // Load time from localStorage & MongoDB
  useEffect(() => {
    const savedData = localStorage.getItem("learningTimeData");
    const today = getTodayDate();

    if (savedData) {
      const parsedData: DailyProgress[] = JSON.parse(savedData);
      const todayEntry = parsedData.find((entry) => entry.date === today);

      if (todayEntry) {
        console.log(`📅 Found today's entry in localStorage:`, todayEntry);
        setTime(todayEntry.time);
      } else {
        console.log("❌ No entry for today in localStorage, resetting timer.");
        setTime(0);
      }
    }

    loadTimeFromDatabase();
  }, [user?.id]);

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;

      setTime((prevTime) => {
        const newTime = prevTime + 1;
        console.log("⏳ Updating time:", newTime);

        const today = getTodayDate();
        const savedData = localStorage.getItem("learningTimeData");
        let data: DailyProgress[] = savedData ? JSON.parse(savedData) : [];

        // Update localStorage
        const todayIndex = data.findIndex((entry) => entry.date === today);
        if (todayIndex !== -1) {
          data[todayIndex].time = newTime;
        } else {
          data.push({ date: today, time: newTime });
        }
        localStorage.setItem("learningTimeData", JSON.stringify(data));

        // Save to MongoDB every minute
        if (newTime % 60 === 0) saveTimeToDatabase(newTime);

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, user?.id]);

  // Reset timer when the day changes
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDate();
      const savedData = localStorage.getItem("learningTimeData");

      if (savedData) {
        const parsedData: DailyProgress[] = JSON.parse(savedData);
        const latestEntry = parsedData[parsedData.length - 1];

        if (latestEntry?.date !== today) {
          console.log("🌅 New day detected, resetting timer.");
          setTime(0);
          saveTimeToDatabase(0);
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Pause timer when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("🛑 Tab hidden, pausing timer...");
        setIsRunning(false);
        saveTimeToDatabase(time);
      } else {
        console.log("▶️ Tab visible, resuming timer...");
        setIsRunning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [time]);

  // Format time display
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  return (
    <Card className="p-4 flex items-center gap-2 bg-primary/5">
      <Clock className="h-5 w-5 text-primary" />
      <div className="font-medium">
        {hours.toString().padStart(2, "0")}:
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log(isRunning ? "⏸️ Pausing Timer" : "▶️ Starting Timer");
            setIsRunning(!isRunning);
            if (!isRunning) {
              saveTimeToDatabase(time);
            }
          }}
          className="h-8 w-8"
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
    </Card>
  );
}
