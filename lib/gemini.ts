// This is a mock implementation for Gemini AI integration
// In a real application, this would connect to the Gemini API

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { supabase } from "@/lib/supabase";

// Define interfaces for the learning path structure
export interface LearningResource {
  id?: string;
  title: string;
  type?: string;
  resourceType?: string;
  url?: string;
  content?: string;
  description: string;
  difficultyLevel?: string;
  estimatedTime?: number;
}

export interface LearningModule {
  id?: string;
  title: string;
  description: string;
  duration?: string;
  resources: LearningResource[];
  position?: number;
}

export interface LearningPath {
  id?: string;
  title: string;
  skills?: string[];
  description?: string;
  timeCommitment?: string;
  modules: LearningModule[];
}

export interface GeminiGenerateParams {
  skill: string;
  timeCommitment: string;
  userId: string;
  roadmapId: string;
}

// Check if Gemini API key is configured and valid
export async function checkGeminiConfig(): Promise<{ 
  hasKey: boolean;
  isValid: boolean;
  modelVersion: string;
}> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return { hasKey: false, isValid: false, modelVersion: 'none' };
    }
    
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test with a simple prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Simple validation check
    const result = await model.generateContent("Say 'API key is valid' if you can read this.");
    const text = result.response.text();
    
    return { 
      hasKey: true, 
      isValid: text.includes('API key is valid'), 
      modelVersion: 'gemini-2.0-flash'
    };
  } catch (error) {
    console.error("Error checking Gemini API key:", error);
    return {
      hasKey: !!process.env.GEMINI_API_KEY,
      isValid: false,
      modelVersion: 'gemini-2.0-flash'
    };
  }
}

// Generate a learning path using Gemini
export async function generateLearningPath(
  skills: string[] | string,
  timeCommitment: string,
  userId?: string,
  roadmapId?: string
): Promise<LearningPath> {
  try {
    // Check if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("Gemini API key not found. Using mock data instead.");
      return getMockLearningPath(skills, timeCommitment);
    }
    
    // Normalize skills to array
    const skillsArray = Array.isArray(skills) ? skills : [skills];
    
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Configure safety settings
    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
    
    // Structured prompt
    const prompt = `
      I want you to create a comprehensive learning path for ${skillsArray.join(', ')} with a time commitment of ${timeCommitment}.
      
      The learning path should include:
      1. A title for the learning path
      2. A breakdown of modules with descriptions and estimated duration
      3. Specific, high-quality learning resources for each module including:
         - Title of resource
         - Type (article, video, course, project, etc.)
         - URL
         - Brief description
      
      Please format your response as JSON with the following structure:
      {
        "title": "Learning Path Title",
        "skills": ["Skill 1", "Skill 2"],
        "timeCommitment": "${timeCommitment}",
        "modules": [
          {
            "title": "Module Title",
            "description": "Module description",
            "duration": "Estimated duration",
            "resources": [
              {
                "title": "Resource Title",
                "type": "Resource type",
                "url": "Resource URL",
                "description": "Resource description"
              }
            ]
          }
        ]
      }
      
      Focus on providing practical, actionable steps with the best quality resources. Ensure URLs are accurate and resources are well-regarded in the field.
    `;
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    });
    
    // Parse the response
    const textResponse = result.response.text();
    
    // Extract JSON from the response (handling potential text before/after JSON)
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Could not extract JSON from Gemini response. Using mock data instead.");
      return getMockLearningPath(skills, timeCommitment);
    }
    
    try {
      const learningPath = JSON.parse(jsonMatch[0]) as LearningPath;
      
      // Set ID if provided
      if (roadmapId) {
        learningPath.id = roadmapId;
      }
      
      // Transform resources if needed
      learningPath.modules = learningPath.modules.map((module, moduleIndex) => {
        // Set module ID and position
        if (!module.id) {
          module.id = `module-${moduleIndex}`;
        }
        module.position = moduleIndex;
        
        // Map resources to include required fields
        module.resources = module.resources.map((resource, resourceIndex) => {
          return {
            id: `resource-${moduleIndex}-${resourceIndex}`,
            title: resource.title,
            description: resource.description,
            resourceType: resource.type,
            url: resource.url,
            difficultyLevel: moduleIndex === 0 ? "beginner" : 
                            moduleIndex === learningPath.modules.length - 1 ? "advanced" : 
                            "intermediate",
            estimatedTime: 30, // Default estimated time
          };
        });
        
        return module;
      });
      
      // Try to save to Supabase if we have the user ID and roadmap ID
      if (userId && roadmapId) {
        saveToSupabase(learningPath, roadmapId);
      }
      
      return learningPath;
    } catch (parseError) {
      console.error("Error parsing Gemini JSON response:", parseError);
      return getMockLearningPath(skills, timeCommitment);
    }
  } catch (error) {
    console.error("Error generating learning path with Gemini:", error);
    return getMockLearningPath(skills, timeCommitment);
  }
}

// Try to save learning path to Supabase
async function saveToSupabase(learningPath: LearningPath, roadmapId: string) {
  try {
    // Check if Supabase is connected
    const { error: connectionError } = await supabase.from("roadmaps").select("id").limit(1);
    if (connectionError) {
      console.error("Supabase connection error, skipping save:", connectionError);
      return;
    }
    
    // Update roadmap description
    await supabase
      .from("roadmaps")
      .update({
        description: learningPath.description || `A learning path for ${learningPath.skills?.join(', ') || 'skills'}`,
      })
      .eq("id", roadmapId);
    
    // Save modules and resources
    for (let i = 0; i < learningPath.modules.length; i++) {
      const module = learningPath.modules[i];
      
      for (let j = 0; j < module.resources.length; j++) {
        const resource = module.resources[j];
        
        // Insert resource
        const { error: resourceError } = await supabase
          .from("learning_resources")
          .insert({
            id: `resource-${roadmapId}-${i}-${j}`,
            title: resource.title,
            description: resource.description,
            resource_type: resource.resourceType || "other",
            url: resource.url,
            content: resource.content,
            difficulty_level: resource.difficultyLevel || "intermediate",
            estimated_time: resource.estimatedTime || 30,
          });
          
        if (resourceError) {
          console.error("Error inserting resource:", resourceError);
          continue;
        }
        
        // Create roadmap_resources junction
        const { error: junctionError } = await supabase
          .from("roadmap_resources")
          .insert({
            roadmap_id: roadmapId,
            resource_id: `resource-${roadmapId}-${i}-${j}`,
            position: i * 100 + j,
          });
          
        if (junctionError) {
          console.error("Error inserting roadmap_resource:", junctionError);
        }
      }
    }
  } catch (error) {
    console.error("Error saving to Supabase:", error);
  }
}

// Fallback to mock data if API key is missing or an error occurs
function getMockLearningPath(skills: string[] | string, timeCommitment: string): LearningPath {
  // Normalize skills to array
  const skillsArray = Array.isArray(skills) ? skills : [skills];
  
  return {
    title: `Learning Path for ${skillsArray.join(' & ')}`,
    skills: skillsArray,
    description: `A comprehensive learning path to master ${skillsArray.join(', ')} in ${timeCommitment}`,
    timeCommitment: timeCommitment,
    modules: [
      {
        id: "module-0",
        title: "Fundamentals",
        description: "Core concepts and basics",
        duration: "30% of your time commitment",
        position: 0,
        resources: [
          {
            id: "resource-0-0",
            title: "Getting Started Guide",
            description: "Comprehensive introduction to the fundamentals",
            resourceType: "article",
            url: "https://example.com/guide",
            difficultyLevel: "beginner",
            estimatedTime: 30
          },
          {
            id: "resource-0-1",
            title: "Basic Concepts Video Course",
            description: "Visual explanations of core concepts",
            resourceType: "video",
            url: "https://example.com/videos",
            difficultyLevel: "beginner",
            estimatedTime: 30
          }
        ]
      },
      {
        id: "module-1",
        title: "Intermediate Concepts",
        description: "Building on the basics",
        duration: "40% of your time commitment",
        position: 1,
        resources: [
          {
            id: "resource-1-0",
            title: "Intermediate Tutorials",
            description: "Detailed tutorials on intermediate topics",
            resourceType: "course",
            url: "https://example.com/intermediate",
            difficultyLevel: "intermediate",
            estimatedTime: 40
          },
          {
            id: "resource-1-1",
            title: "Practice Project",
            description: "Hands-on project to apply your knowledge",
            resourceType: "project",
            url: "https://example.com/project",
            difficultyLevel: "intermediate",
            estimatedTime: 40
          }
        ]
      },
      {
        id: "module-2",
        title: "Advanced Applications",
        description: "Taking your skills to the next level",
        duration: "30% of your time commitment",
        position: 2,
        resources: [
          {
            id: "resource-2-0",
            title: "Advanced Techniques",
            description: "In-depth exploration of advanced topics",
            resourceType: "article",
            url: "https://example.com/advanced",
            difficultyLevel: "advanced",
            estimatedTime: 30
          },
          {
            id: "resource-2-1",
            title: "Real-world Application",
            description: "Build a comprehensive application using your skills",
            resourceType: "project",
            url: "https://example.com/application",
            difficultyLevel: "advanced",
            estimatedTime: 30
          }
        ]
      }
    ]
  };
}

