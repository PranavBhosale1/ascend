import { NextResponse } from 'next/server';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Store your API key in .env.local

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
    }

    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateText', // Update with correct Gemini endpoint
      {
        prompt: { text: prompt },
        temperature: 0.7,
        maxTokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
      }
    );

    const generatedText = response.data?.candidates?.[0]?.output || 'No response from Gemini.';

    return NextResponse.json({ notes: generatedText });
  } catch (error) {
    console.error('Error generating notes:', error);
    return NextResponse.json({ error: 'Failed to generate notes.' }, { status: 500 });
  }
}
