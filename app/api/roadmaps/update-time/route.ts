import  connectToDB  from "@/lib/mongodb"
import TimeModel from "@/models/time"

export async function GET(req: Request) {
  try {
    await connectToDB()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 })
    }

    // Find today's record
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const userTime = await TimeModel.findOne({
      userId,
      date: today.toISOString(),
    })

    if (!userTime) {
      return new Response(JSON.stringify({ learningTime: 0, timestamps: [] }), { status: 200 })
    }

    return new Response(JSON.stringify(userTime), { status: 200 })
  } catch (error) {
    console.error("❌ Error fetching time:", error)
    return new Response(JSON.stringify({ error: "Failed to fetch data" }), { status: 500 })
  }
}

export async function POST(req: Request) {
    try {
      await connectToDB()
      const { userId, date, time } = await req.json() // ✅ Extract `date` from request
  
      if (!userId || time === undefined || !date) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 })
      }
  
      // ✅ Ensure we only store `YYYY-MM-DD` format
      const formattedDate = date.split("T")[0] // Removes time if present
  
      // ✅ Find or update the record correctly
      const userTime = await TimeModel.findOneAndUpdate(
        { userId, date: formattedDate }, // ✅ Use `date` from request
        { $set: { time, lastUpdated: new Date() } }, // ✅ Ensure `time` matches MongoDB field
        { upsert: true, new: true }
      )
  
      console.log("✅ Updated time in MongoDB:", userTime)
  
      return new Response(JSON.stringify({ success: true, userTime }), { status: 200 })
    } catch (error) {
      console.error("❌ Error saving time:", error)
      return new Response(JSON.stringify({ error: "Failed to update MongoDB" }), { status: 500 })
    }
  }
  