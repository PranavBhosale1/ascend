import { NextResponse } from 'next/server';
import { generateLearningPath } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    // Extract request body
    const body = await request.json();
    const { skills, timeCommitment } = body;
    
    // Validate input
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Skills are required and must be an array' },
        { status: 400 }
      );
    }
    
    if (!timeCommitment || typeof timeCommitment !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Time commitment is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Generate learning path
    const learningPath = await generateLearningPath(skills, timeCommitment);
    
    return NextResponse.json({ success: true, learningPath });
  } catch (error) {
    console.error('Error generating learning path:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error generating learning path', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 