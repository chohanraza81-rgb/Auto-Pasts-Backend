import { prisma } from './prisma';
import crypto from 'crypto';
import { setCache, getCache } from './cache';

// Updated model list with latest free tier flash models
const MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const MAX_RETRIES_PER_MODEL = 2;

function hashPrompt(prompt: string): string {
  return crypto.createHash('sha256').update(prompt).digest('hex');
}

async function callGemini(model: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.9,
          topK: 40
        }
      })
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    // Treat 404 (model not found) as skip to next model
    if (res.status === 404) {
      throw new Error('MODEL_NOT_FOUND');
    }
    throw new Error(`Gemini API ${res.status}: ${errorText}`);
  }

  const data: any = await res.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!content) throw new Error('Empty response from Gemini');
  return content;
}

export async function generateWithGemini(keyword: string, report: string): Promise<string> {
  const promptHash = hashPrompt(report);
  const cacheKey = `gemini:${keyword}:${promptHash}`;

  // Check memory cache first
  const memCached = getCache<string>(cacheKey);
  if (memCached) return memCached;

  // Check database cache
  const dbCached = await prisma.aiCache.findFirst({
    where: { keyword, promptHash }
  });
  if (dbCached) {
    setCache(cacheKey, dbCached.content, 86400);
    return dbCached.content;
  }

  const systemPrompt = `You are MIKE JOHNSON, 47. 20 years owning Mike's Auto Garage in Toronto. You've installed 10,000+ brake pads.
Write a 1500-2000 word article. Use ONLY the USER REPORT below. No lies.

USER REPORT:
${report}

WRITING RULES TO BEAT AI DETECTORS & RANK:
1. HOOK: Start with real story from your garage last week/month
2. TONE: Talk to 'buddy'. Use: eh, she's a beauty, double-double, gonna, ain't. 2-3 typos then fix them
3. OPINION: 'I've tried 4 brands. Duralast is garbage. Buy Bosch.'
4. DATA: Use numbers from REPORT. Prices in CAD. Shops in Toronto/Vancouver
5. STRUCTURE: H2 from KEY POINTS. Add 1 comparison table, 1 bullet list
6. FAQ: Answer all FAQs from REPORT. Pull PAA from SerpApi if needed
7. AFFILIATE: Add 'Where I Buy Parts' section with links from REPORT
8. CTA: End with 'Need help? Come to my shop or get 50 leads here'
9. E-E-A-T: Add 'By Mike Johnson - 20 Years Experience' + Author Bio
TARGET: Pass Originality.ai < 1% AI, GPTZero < 2%`;

  let lastError: Error | null = null;

  // Try each model in order
  for (const model of MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const content = await callGemini(model, systemPrompt);

        // Save to database cache
        await prisma.aiCache.create({
          data: { keyword, content, modelUsed: model, promptHash }
        });
        setCache(cacheKey, content, 86400);
        return content;
      } catch (err: any) {
        lastError = err;
        if (err.message === 'RATE_LIMITED') {
          await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
          continue;
        }
        // For MODEL_NOT_FOUND or other errors, break inner loop and try next model
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed');
}
