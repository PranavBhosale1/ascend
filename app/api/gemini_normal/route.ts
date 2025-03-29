import { NextResponse } from 'next/server';
import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Store your API key in .env.local

export async function POST(request: Request) {
  try {
    const { prompt, mode, transcript, question } = await request.json();

    if (!mode || (mode !== 'generateNotes' && mode !== 'generateResponse')) {
      return NextResponse.json({ error: 'Invalid mode provided.' }, { status: 400 });
    }

    if (mode === 'generateNotes') {
      if (!prompt) {
        return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
      }
      
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateText',
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
    }

    if (mode === 'generateResponse') {
      if (!transcript || !question) {
        return NextResponse.json({ error: 'Transcript or question missing.' }, { status: 400 });
      }
      
      const combinedPrompt = `${transcript}\n\nUser question: ${question}`;

      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateText',
        {
          prompt: { text: combinedPrompt },
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

      const generatedAnswer = response.data?.candidates?.[0]?.output || 'No response from Gemini.';

      return NextResponse.json({ answer: generatedAnswer });
    }

  } catch (error) {
    console.error('Error generating notes or response:', error);
    return NextResponse.json({ error: 'Failed to generate notes or response.' }, { status: 500 });
  }
}
