"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Calendar, Clock, Plus, Video } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoadmapCreator } from "@/components/roadmap-creator"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Roadmap {
  id: string
  title: string
  learning_goal: string
  experience_level: string
  time_commitment: number
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [progress, setProgress] = useState(58)
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRoadmaps()
    }
  }, [user])

  const fetchRoadmaps = async () => {
    try {
      // Check if Supabase is properly initialized with credentials
      if (!supabase || !user?.id) {
        console.log("Supabase client not initialized or user not authenticated");
        setRoadmaps([]);
        setIsLoading(false);
        return;
      }

      console.log("Fetching roadmaps for user:", user.id);
      
      // First check database connectivity
      const connectivityCheck = await supabase.from('roadmaps').select('count');
      if (connectivityCheck.error) {
        console.error("Database connectivity error:", connectivityCheck.error);
        toast.error("Database connection error", {
          description: "Could not connect to the database. Please try again later."
        });
        setRoadmaps([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching roadmaps:", error);
        if (error.code === "PGRST116") {
          toast.error("Authentication error", {
            description: "Your session may have expired. Please try logging in again."
          });
        } else {
          toast.error("Failed to load roadmaps", {
            description: "There was an error loading your roadmaps."
          });
        }
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} roadmaps`);
      setRoadmaps(data || []);
    } catch (error: any) {
      console.error("Error fetching roadmaps:", error);
      
      // Handle error gracefully with more context
      let errorMessage = "Unknown error occurred";
      if (error.message) errorMessage = error.message;
      if (error.details) errorMessage += `: ${error.details}`;
      
      toast.error("Failed to load roadmaps", {
        description: errorMessage
      });
      
      // Set empty array instead of leaving previous state
      setRoadmaps([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Get the user's name, preferring full_name in user metadata
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Hello, {userName}</h1>
        <p className="text-muted-foreground">What will we learn today?</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Your overall learning journey</CardDescription>
              </div>
              <div className="text-2xl font-bold">{progress}%</div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Courses</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">48</div>
                <div className="text-xs text-muted-foreground">Hours</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-2xl font-bold">86</div>
                <div className="text-xs text-muted-foreground">Videos</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Courses
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="col-span-full md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Roadmaps</CardTitle>
              <Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLButtonElement>('.roadmap-creator-button')?.click()}>
                <Plus className="mr-2 h-4 w-4" />
                New Roadmap
              </Button>
            </div>
            <CardDescription>Personalized learning paths</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : roadmaps.length > 0 ? (
              <div className="space-y-4">
                {roadmaps.map((roadmap) => (
                  <Link 
                    key={roadmap.id} 
                    href={`/dashboard/learning?roadmap=${roadmap.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{roadmap.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{roadmap.time_commitment} hours/week</span>
                          </div>
                          <div className="capitalize">{roadmap.experience_level}</div>
                        </div>
                      </div>
                      <Progress value={Math.floor(Math.random() * 100)} className="h-2 w-24" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No roadmaps yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first learning roadmap to get started
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => document.querySelector<HTMLButtonElement>('.roadmap-creator-button')?.click()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Roadmap
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>Your upcoming learning sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border p-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Web Development Basics</p>
                  <p className="text-xs text-muted-foreground">Today, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border p-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">AI Fundamentals</p>
                  <p className="text-xs text-muted-foreground">Tomorrow, 10:00 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full">View All</Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Based on your learning history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex gap-4 rounded-lg border p-3">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-medium">React Hooks Deep Dive</h3>
                <p className="text-xs text-muted-foreground mt-1">Master React Hooks with practical examples</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border p-3">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-medium">Tailwind CSS Masterclass</h3>
                <p className="text-xs text-muted-foreground mt-1">Build modern UIs with Tailwind CSS</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-lg border p-3">
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                <div className="absolute inset-0 bg-muted flex items-center justify-center">
                  <Video className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <div>
                <h3 className="font-medium">Advanced JavaScript</h3>
                <p className="text-xs text-muted-foreground mt-1">Learn advanced JavaScript concepts</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Roadmap Creator Button and Modal */}
      <div className="hidden">
        <button className="roadmap-creator-button"></button>
      </div>
      <RoadmapCreator />
    </div>
  )
}
