import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { time } = await req.json()
    if (typeof time !== 'number') {
      return NextResponse.json({ error: "Invalid time value" }, { status: 400 })
    }

    const { db } = await connectToDatabase()
    const today = new Date()
    const dateKey = today.toISOString().split('T')[0] // Format: YYYY-MM-DD
    
    // Update or insert the user's learning time with daily timestamps
    await db.collection('userProgress').updateOne(
      { userId: session.user.id },
      { 
        $set: { 
          [`dailyTime.${dateKey}`]: {
            totalTime: time,
            lastUpdated: new Date(),
            timestamps: {
              $push: {
                time: time,
                timestamp: new Date()
              }
            }
          }
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating learning time:', error)
    return NextResponse.json({ error: "Failed to update learning time" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const today = new Date()
    const dateKey = today.toISOString().split('T')[0] // Format: YYYY-MM-DD
    
    // Get the user's learning time for today
    const userProgress = await db.collection('userProgress').findOne(
      { userId: session.user.id }
    )

    const todayProgress = userProgress?.dailyTime?.[dateKey] || { totalTime: 0, timestamps: [] }

    return NextResponse.json({ 
      learningTime: todayProgress.totalTime || 0,
      timestamps: todayProgress.timestamps || []
    })
  } catch (error) {
    console.error('Error fetching learning time:', error)
    return NextResponse.json({ error: "Failed to fetch learning time" }, { status: 500 })
  }
} 