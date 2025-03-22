"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BookOpen, CheckCircle, ChevronDown, ChevronRight, Clock, ExternalLink, Play, Video } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Roadmap {
  id: string
  title: string
  learning_goal: string
  experience_level: string
  time_commitment: number
  created_at: string
}

interface LearningResource {
  id: string
  title: string
  description: string
  resource_type: string
  url: string
  content: string
  difficulty_level: string
  estimated_time: number
}

interface JoinedResourceData {
  position: number;
  learning_resources: {
    id: string;
    title: string;
    description: string;
    resource_type: string;
    url: string | null;
    content: string | null;
    difficulty_level: string;
    estimated_time: number;
  };
}

// Mock data for demonstration
const mockModules = [
  {
    id: 1,
    title: "Introduction to the Topic",
    lessons: [
      { id: 1, title: "Overview and Fundamentals", completed: true },
      {
        id: 2, 
        title: "Core Concepts and Terminology", 
        completed: true 
      },
      { 
        id: 3, 
        title: "Setting Up Your Environment", 
        completed: false 
      }
    ]
  },
  {
    id: 2,
    title: "Building Your First Project",
    lessons: [
      { id: 4, title: "Project Structure and Setup", completed: false },
      { id: 5, title: "Implementing Core Features", completed: false },
      { id: 6, title: "Testing and Debugging", completed: false }
    ]
  },
  {
    id: 3,
    title: "Advanced Techniques",
    lessons: [
      { id: 7, title: "Performance Optimization", completed: false },
      { id: 8, title: "Best Practices and Patterns", completed: false },
      { id: 9, title: "Real-world Applications", completed: false }
    ]
  }
];

export default function LearningPage() {
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("roadmap");
  const { user } = useAuth();
  
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<number | null>(1);
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [progress, setProgress] = useState(15);
  
  useEffect(() => {
    if (user && roadmapId) {
      fetchRoadmapData();
    }
  }, [user, roadmapId]);
  
  const fetchRoadmapData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch roadmap details
      const { data: roadmapData, error: roadmapError } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', roadmapId)
        .single();
      
      if (roadmapError) throw roadmapError;
      
      setRoadmap(roadmapData);
      
      // Fetch learning resources for this roadmap
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('roadmap_resources')
        .select(`
          position,
          learning_resources:resource_id (
            id,
            title,
            description,
            resource_type,
            url,
            content,
            difficulty_level,
            estimated_time
          )
        `)
        .eq('roadmap_id', roadmapId)
        .order('position');
      
      if (resourcesError) {
        console.error('Error fetching learning resources:', resourcesError);
        throw resourcesError;
      }
      
      if (resourcesData && resourcesData.length > 0) {
        // Process the resources
        const formattedResources = (resourcesData as JoinedResourceData[]).map(item => ({
          id: item.learning_resources.id,
          title: item.learning_resources.title,
          description: item.learning_resources.description,
          resource_type: item.learning_resources.resource_type,
          url: item.learning_resources.url || undefined,
          content: item.learning_resources.content || undefined,
          difficulty_level: item.learning_resources.difficulty_level,
          estimated_time: item.learning_resources.estimated_time
        }));
        
        setResources(formattedResources);
        console.log('Fetched learning resources:', formattedResources);
      } else {
        console.log('No learning resources found for this roadmap');
        // If no resources are found, we'll provide a fallback with mock data
        setResources([
          {
            id: "fallback-1",
            title: "Introduction to " + roadmapData.learning_goal,
            description: "Learn the fundamentals and core concepts",
            resource_type: "video",
            url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(roadmapData.learning_goal + " introduction"),
            content: "This is a fallback resource to get you started.",
            difficulty_level: "beginner",
            estimated_time: 30
          },
          {
            id: "fallback-2",
            title: "Core Concepts of " + roadmapData.learning_goal,
            description: "Understanding the key terminology and concepts",
            resource_type: "article",
            url: "https://www.google.com/search?q=" + encodeURIComponent(roadmapData.learning_goal + " concepts"),
            content: "This is a fallback resource with key concepts.",
            difficulty_level: "beginner",
            estimated_time: 20
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching roadmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  
  const handleLessonClick = (lessonId: number) => {
    setActiveLesson(lessonId);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          {isLoading ? <Skeleton className="h-9 w-64" /> : roadmap?.title || "Learning Path"}
        </h1>
        <div className="flex items-center gap-4">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-medium">{progress}% Complete</span>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar with modules and lessons */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Course Outline</CardTitle>
            <CardDescription>Track your progress through the modules</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {mockModules.map((module) => (
                  <Collapsible 
                    key={module.id} 
                    open={expandedModules.includes(module.id)}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between p-3 h-auto font-medium"
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>{module.title}</span>
                        </div>
                        {expandedModules.includes(module.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-1 p-2 pt-0">
                        {module.lessons.map((lesson) => (
                          <Button
                            key={lesson.id}
                            variant={activeLesson === lesson.id ? "secondary" : "ghost"}
                            className="w-full justify-start pl-6 h-auto py-2"
                            onClick={() => handleLessonClick(lesson.id)}
                          >
                            <div className="flex items-center gap-2">
                              {lesson.completed ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-muted-foreground" />
                              )}
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Main content area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overview and Fundamentals</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  <span>30 minutes</span>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="video">
              <TabsList className="mb-4">
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="video" className="space-y-4">
                <div className="aspect-video overflow-hidden rounded-lg bg-black">
                  <div className="flex h-full items-center justify-center">
                    <Button variant="outline" size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Play Video
                    </Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium">Introduction to the Topic</h3>
                  <p className="mt-2 text-muted-foreground">
                    This video introduces the fundamental concepts and provides an overview of what you'll learn in this course. 
                    We'll cover the core principles, terminology, and set up the foundation for more advanced topics.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <h3>Key Concepts</h3>
                  <ul>
                    <li>Understanding the core principles</li>
                    <li>Learning the fundamental terminology</li>
                    <li>Setting up your development environment</li>
                    <li>Creating your first project structure</li>
                  </ul>
                  
                  <h3>Important Terminology</h3>
                  <p>
                    Before diving deeper, it's essential to understand these key terms that will be used throughout the course:
                  </p>
                  <ul>
                    <li><strong>Term 1</strong>: Definition and explanation</li>
                    <li><strong>Term 2</strong>: Definition and explanation</li>
                    <li><strong>Term 3</strong>: Definition and explanation</li>
                  </ul>
                  
                  <h3>Getting Started</h3>
                  <p>
                    To begin working with this technology, you'll need to set up your environment properly. 
                    Follow these steps to ensure you have everything installed correctly:
                  </p>
                  <ol>
                    <li>Install the required dependencies</li>
                    <li>Configure your settings</li>
                    <li>Verify your installation</li>
                    <li>Create your first project</li>
                  </ol>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Resources</h3>
                  <div className="space-y-2">
                    <a 
                      href="#" 
                      className="flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <ExternalLink className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Official Documentation</h4>
                        <p className="text-sm text-muted-foreground">
                          Comprehensive guide to all features and APIs
                        </p>
                      </div>
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Tutorial Series</h4>
                        <p className="text-sm text-muted-foreground">
                          Step-by-step video tutorials for beginners
                        </p>
                      </div>
                    </a>
                    <a 
                      href="#" 
                      className="flex items-center gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Practice Exercises</h4>
                        <p className="text-sm text-muted-foreground">
                          Hands-on exercises to reinforce your learning
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
