import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import TimeModel from "@/models/time";

export async function GET(req: Request) {
  try {
    await connectToDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const today = new Date();
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    });

    // Fetch data from MongoDB
    const timeData = await TimeModel.find({ userId, date: { $in: last7Days } });

    // Ensure all 7 days are included in the response
    const response = last7Days.map((date) => ({
      date,
      time: timeData.find((entry) => entry.date === date)?.time || 0, // Default 0 if no data
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error fetching weekly time data:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
