"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Unlock, 
  ChevronRight, 
  ArrowRight, 
  Star, 
  Trophy,
  Map
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { Timer } from "@/components/timer"

interface Topic {
  _id: string
  name: string
  queries: string[]
  links: string[][]
  day: number
  position: number
  completed: boolean
}

interface Roadmap {
  _id: string
  roadmapId: string
  title: string
  description: string
  topics: Topic[]
  completedVideos: string[]
  progress: number
  totalVideos: number
  learningTime?: number
}

export default function RoadmapVisualizationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [learningTime, setLearningTime] = useState(0)
  const [lastSavedTime, setLastSavedTime] = useState(0)
  
  // Fetch roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!user || !params.id) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/roadmaps/get?roadmapId=${params.id}&supabaseUserId=${user.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch roadmap')
        }
        
        const data = await response.json()
        
        if (data.success && data.roadmap) {
          // Sort topics by day and position
          const sortedTopics = [...data.roadmap.topics].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day
            return a.position - b.position
          })
          
          setRoadmap({...data.roadmap, topics: sortedTopics})
          
          // Set the first incomplete topic as active
          const firstIncompleteTopic = sortedTopics.find(topic => !topic.completed)
          if (firstIncompleteTopic) {
            setActiveTopic(firstIncompleteTopic)
          } else {
            setActiveTopic(sortedTopics[0])
          }
        } else {
          throw new Error(data.message || 'Failed to fetch roadmap')
        }
      } catch (error) {
        toast.error('Error loading roadmap visualization')
        console.error('Error fetching roadmap:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRoadmap()
  }, [params.id, user])
  
  // Save learning time periodically
  useEffect(() => {
    const saveInterval = setInterval(async () => {
      if (learningTime > lastSavedTime && user && params.id) {
        try {
          const response = await fetch('/api/roadmaps/update-time', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              roadmapId: params.id,
              supabaseUserId: user.id,
              learningTime: learningTime - lastSavedTime,
            }),
          })
          
          if (response.ok) {
            setLastSavedTime(learningTime)
          }
        } catch (error) {
          console.error('Error saving learning time:', error)
        }
      }
    }, 60000) // Save every minute
    
    return () => clearInterval(saveInterval)
  }, [learningTime, lastSavedTime, user, params.id])
  
  // Handle topic click
  const handleTopicClick = (topic: Topic) => {
    // Only allow clicking completed topics or the next available topic
    const topicIndex = roadmap?.topics.findIndex(t => t._id === topic._id) || 0
    const previousTopicsCompleted = topicIndex === 0 || 
      roadmap?.topics.slice(0, topicIndex).every(t => t.completed)
    
    if (topic.completed || previousTopicsCompleted) {
      setActiveTopic(topic)
      
      // Scroll the topic into view
      setTimeout(() => {
        const topicElement = document.getElementById(`topic-${topic._id}`)
        if (topicElement && containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth
          const topicLeft = topicElement.offsetLeft
          containerRef.current.scrollTo({
            left: topicLeft - containerWidth / 2 + 50,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }
  
  // Navigate to learning page for the active topic
  const navigateToLearning = () => {
    if (activeTopic) {
      router.push(`/dashboard/roadmap/${params.id}?topic=${activeTopic._id}`)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container py-10 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  if (!roadmap) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Roadmap Not Found</CardTitle>
            <CardDescription>
              The roadmap you're looking for doesn't exist or you don't have access to it.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Group topics by day
  const dayGroups = roadmap.topics.reduce((groups, topic) => {
    const day = topic.day
    if (!groups[day]) {
      groups[day] = []
    }
    groups[day].push(topic)
    return groups
  }, {} as Record<number, Topic[]>)
  
  // Sort days
  const sortedDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b)
  
  return (
    <div className="container py-10 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Map className="mr-2 h-7 w-7 text-primary" />
            {roadmap.title} - Visual Roadmap
          </h1>
          <p className="text-muted-foreground mt-1">{roadmap.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            Progress: {roadmap.progress || 0}%
          </Badge>
          <Button onClick={() => router.back()} variant="outline" size="sm">
            Back
          </Button>
        </div>
      </div>
      
      {/* Roadmap visualization */}
      <div className="overflow-hidden">
        <div 
          ref={containerRef}
          className="overflow-x-auto pb-6 pt-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="roadmap-path min-w-max" style={{ width: 'max-content', padding: '20px 100px' }}>
            <div className="relative">
              {/* Path background - zigzag path */}
              <div className="absolute top-[50px] left-0 right-0 h-2 bg-muted z-0">
                {sortedDays.map((day, dayIndex) => {
                  const topics = dayGroups[day]
                  return topics.map((topic, topicIndex) => {
                    const isFirst = dayIndex === 0 && topicIndex === 0
                    const isLast = dayIndex === sortedDays.length - 1 && topicIndex === topics.length - 1
                    
                    if (isFirst || isLast) return null
                    
                    // Create zigzag effect every other topic
                    const offset = (dayIndex + topicIndex) % 2 === 0 ? -30 : 30
                    
                    return (
                      <div 
                        key={`path-${topic._id}`}
                        className="absolute h-8 w-20 bg-muted"
                        style={{ 
                          left: `${(dayIndex * 150) + (topicIndex * 100) + 50}px`,
                          top: `${offset}px`,
                          transform: offset < 0 ? 'translateY(-100%)' : 'translateY(0)',
                        }}
                      ></div>
                    )
                  })
                })}
              </div>
              
              {/* Topics as nodes */}
              <div className="flex items-center relative z-10">
                {sortedDays.map((day, dayIndex) => {
                  const topics = dayGroups[day]
                  return (
                    <div key={`day-${day}`} className="flex flex-col items-center mr-4">
                      <Badge variant="outline" className="mb-6 bg-card">Day {day}</Badge>
                      
                      <div className="flex items-center">
                        {topics.map((topic, topicIndex) => {
                          // Calculate if this topic is unlocked (previous topic completed)
                          const topicPosition = roadmap.topics.findIndex(t => t._id === topic._id)
                          const previousTopicsCompleted = topicPosition === 0 || 
                            roadmap.topics.slice(0, topicPosition).every(t => t.completed)
                          const isUnlocked = topic.completed || previousTopicsCompleted
                          
                          // Offset Y position every other topic to create zigzag effect
                          const offset = (dayIndex + topicIndex) % 2 === 0 ? -30 : 30
                          
                          return (
                            <div 
                              key={topic._id}
                              id={`topic-${topic._id}`}
                              className="relative mx-12"
                              style={{ transform: `translateY(${offset}px)` }}
                            >
                              {/* Draw connecting line to next topic */}
                              {(topicIndex < topics.length - 1 || dayIndex < sortedDays.length - 1) && (
                                <div className="absolute top-1/2 left-[60px] w-[100px] h-0.5 bg-muted -z-10"></div>
                              )}
                              
                              {/* Topic node */}
                              <motion.div
                                whileHover={isUnlocked ? { scale: 1.05 } : {}}
                                whileTap={isUnlocked ? { scale: 0.95 } : {}}
                                className={`
                                  w-[60px] h-[60px] rounded-full flex items-center justify-center cursor-pointer
                                  ${isUnlocked ? 'shadow-md hover:shadow-lg' : 'opacity-60'}
                                  ${topic.completed ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' : 'bg-card border border-muted-foreground/20'}
                                  ${activeTopic?._id === topic._id ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''}
                                `}
                                onClick={() => isUnlocked && handleTopicClick(topic)}
                              >
                                {topic.completed ? (
                                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                                ) : isUnlocked ? (
                                  <Unlock className="h-7 w-7 text-primary" />
                                ) : (
                                  <Lock className="h-7 w-7 text-muted-foreground" />
                                )}
                              </motion.div>
                              
                              {/* Topic label */}
                              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center w-[120px]">
                                <span className="text-xs font-medium truncate block">{topic.name}</span>
                              </div>
                              
                              {/* Progress indicator for partially completed topics */}
                              {!topic.completed && topic.links && topic.links[0] && (
                                <div className="absolute -top-2 -right-2 flex items-center justify-center">
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                    {topic.links[0].filter(url => roadmap.completedVideos?.includes(url)).length}/{topic.links[0].length}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                
                {/* Trophy at the end */}
                <div className="flex flex-col items-center ml-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center"
                  >
                    <Trophy className="h-8 w-8 text-primary" />
                  </motion.div>
                  <span className="text-xs font-medium mt-2">Complete!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Active topic details */}
      {activeTopic && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{activeTopic.name}</CardTitle>
                <CardDescription>Day {activeTopic.day}</CardDescription>
              </div>
              <Badge variant={activeTopic.completed ? "success" : "outline"}>
                {activeTopic.completed ? "Completed" : "In Progress"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Learning Objectives:</h3>
              <ul className="space-y-1">
                {activeTopic.queries.map((query, index) => (
                  <li key={index} className="text-sm flex items-start">
                    <Star className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                    <span>{query}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {activeTopic.links && activeTopic.links[0] && (
              <div>
                <h3 className="text-sm font-medium mb-2">Learning Progress:</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Videos Completed</span>
                    <span>
                      {activeTopic.links[0].filter(url => roadmap.completedVideos?.includes(url)).length}/{activeTopic.links[0].length}
                    </span>
                  </div>
                  <Progress 
                    value={
                      activeTopic.links[0].length > 0
                        ? (activeTopic.links[0].filter(url => roadmap.completedVideos?.includes(url)).length / activeTopic.links[0].length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={navigateToLearning} className="w-full">
              {activeTopic.completed ? "Review Content" : "Start Learning"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
} 