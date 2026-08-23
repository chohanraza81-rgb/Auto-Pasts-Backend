import { Router, Request, Response } from 'express';
import { generateWithGemini } from '../lib/gemini';
import { fetchPAA } from '../lib/serpapi';
import { z } from 'zod';
import { generateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/', generateLimiter, async (req: Request, res: Response) => {
  const schema = z.object({
    keyword: z.string().min(1),
    report: z.string().min(1)
  });
  const { keyword, report } = schema.parse(req.body);

  try {
    // Optionally enhance report with PAA
    const paa = await fetchPAA(keyword);
    const enhancedReport = report + '\n\nFAQ Questions:\n' + paa.map(q => `- ${q}`).join('\n');
    const content = await generateWithGemini(keyword, enhancedReport);
    res.json({ content });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Generation failed. Please try again.' });
  }
});

export default router;
