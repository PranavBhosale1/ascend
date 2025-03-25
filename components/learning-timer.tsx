"use client"

import { useEffect, useState, useRef } from "react"
import { Clock, Play, Pause } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface TimeStamp {
  time: number
  timestamp: Date
}

interface DailyProgress {
  totalTime: number
  lastUpdated: Date
  timestamps: TimeStamp[]
}

export function LearningTimer() {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const lastActivityRef = useRef(Date.now())
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>()
  const { user } = useAuth()
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const [dailyProgress, setDailyProgress] = useState<DailyProgress | null>(null)

  // Function to save time to MongoDB
  const saveTimeToDatabase = async () => {
    if (!user?.id) return

    try {
      await fetch('/api/roadmaps/update-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ time }),
      })
    } catch (error) {
      console.error('Failed to save time to database:', error)
    }
  }

  // Function to load time from MongoDB
  const loadTimeFromDatabase = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/roadmaps/update-time')
      const data = await response.json()
      if (data.learningTime) {
        setTime(data.learningTime)
        setDailyProgress({
          totalTime: data.learningTime,
          lastUpdated: new Date(),
          timestamps: data.timestamps || []
        })
      }
    } catch (error) {
      console.error('Failed to load time from database:', error)
    }
  }

  useEffect(() => {
    // Load saved time from localStorage and database
    const savedTime = localStorage.getItem('learningTime')
    if (savedTime) {
      setTime(parseInt(savedTime))
    }
    loadTimeFromDatabase()

    // Function to update last activity time
    const updateLastActivity = () => {
      lastActivityRef.current = Date.now()
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      // Set new timeout for 30 minutes
      inactivityTimeoutRef.current = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setIsRunning(false)
          saveTimeToDatabase()
        }
      }, 30 * 60 * 1000) // 30 minutes in milliseconds
    }

    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // If tab becomes visible, check if we should auto-start
        const timeSinceLastActivity = Date.now() - lastActivityRef.current
        if (timeSinceLastActivity < 30 * 60 * 1000) {
          setIsRunning(true)
        }
      } else {
        // If tab becomes hidden, pause the timer and save
        setIsRunning(false)
        saveTimeToDatabase()
      }
    }

    // Function to handle beforeunload
    const handleBeforeUnload = () => {
      saveTimeToDatabase()
    }

    // Add event listeners for activity detection
    window.addEventListener('mousemove', updateLastActivity)
    window.addEventListener('keydown', updateLastActivity)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Start the timer
    const interval = setInterval(() => {
      if (isRunning) {
        setTime(prevTime => {
          const newTime = prevTime + 1
          // Save to localStorage every second
          localStorage.setItem('learningTime', newTime.toString())
          // Save to database every minute
          if (newTime % 60 === 0) {
            saveTimeToDatabase()
          }
          return newTime
        })
      }
    }, 1000)

    // Initial activity timeout setup
    updateLastActivity()

    // Cleanup function
    return () => {
      clearInterval(interval)
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      window.removeEventListener('mousemove', updateLastActivity)
      window.removeEventListener('keydown', updateLastActivity)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      saveTimeToDatabase() // Save one final time before unmounting
    }
  }, [isRunning, user?.id])

  // Format time into hours, minutes, and seconds
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = time % 60

  const toggleTimer = () => {
    setIsRunning(!isRunning)
    if (!isRunning) {
      saveTimeToDatabase()
    }
  }

  return (
    <Card className="p-4 flex items-center gap-2 bg-primary/5">
      <Clock className="h-5 w-5 text-primary" />
      <div className="font-medium">
        {hours.toString().padStart(2, '0')}:
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTimer}
          className="h-8 w-8"
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
} 