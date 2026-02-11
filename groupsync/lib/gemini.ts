import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found. AI features will be disabled.');
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }

  return genAI;
}

export function getGeminiModel() {
  const client = getGeminiClient();
  if (!client) return null;

  return client.getGenerativeModel({ model: 'gemini-pro' });
}
