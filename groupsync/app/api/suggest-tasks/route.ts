import { NextRequest, NextResponse } from 'next/server';

import { getGeminiModel } from '@/lib/gemini';

function parseSuggestions(text: string) {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Model did not return an array');
  }

  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      return {
        title: String(row.title ?? '').slice(0, 120),
        description: String(row.description ?? '').slice(0, 500),
        estimatedHours: Number(row.estimatedHours ?? 1) || 1,
        priority: row.priority === 'high' || row.priority === 'medium' || row.priority === 'low' ? row.priority : 'medium',
      };
    })
    .filter((item) => item && item.title);
}

export async function POST(request: NextRequest) {
  try {
    const { projectName, description, deadline } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI suggestions not configured' }, { status: 503 });
    }

    const model = getGeminiModel();
    if (!model) {
      return NextResponse.json({ error: 'AI suggestions not configured' }, { status: 503 });
    }

    const prompt = `You are helping a student team break down a group project into actionable tasks.

Project: ${projectName}
Description: ${description || 'No description provided'}
Deadline: ${deadline || 'No deadline set'}

Generate 5-7 specific, actionable tasks. For each task provide:
- title: short task name (under 50 characters)
- description: one sentence explaining what needs to be done
- estimatedHours: rough time estimate as a number
- priority: "high", "medium", or "low"

Return ONLY a valid JSON array.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const tasks = parseSuggestions(text);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
