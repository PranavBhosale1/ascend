"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface TimerProps {
  onTimeUpdate?: (seconds: number) => void
  initialTime?: number
}

export function Timer({ onTimeUpdate, initialTime = 0 }: TimerProps) {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime + 1
          onTimeUpdate?.(newTime)
          return newTime
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, onTimeUpdate])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setTime(0)
    setIsRunning(false)
    onTimeUpdate?.(0)
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardContent className="p-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-mono font-bold">{formatTime(time)}</div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTimer}
              className="h-7 w-7"
            >
              {isRunning ? (
                <Pause className="h-3 w-3" />
              ) : (
                <Play className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={resetTimer}
              className="h-7 w-7"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 