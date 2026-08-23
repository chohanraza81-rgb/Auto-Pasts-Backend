import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// GET /api/keywords
router.get('/', async (req: Request, res: Response) => {
  const keywords = await prisma.keyword.findMany({
    orderBy: { volume: 'desc' }
  });
  res.json(keywords);
});

// POST /api/keywords
router.post('/', async (req: Request, res: Response) => {
  const schema = z.object({
    keyword: z.string().min(1),
    volume: z.number().int().nonnegative(),
    kd: z.number().int().nonnegative(),
    cpc: z.number().nonnegative().optional(),
    intent: z.string().min(1),
    city: z.string().optional(),
    car: z.string().optional(),
    difficulty: z.string().min(1)
  });
  const data = schema.parse(req.body);
  const kw = await prisma.keyword.create({ data });
  res.json(kw);
});

// POST /api/keywords/import (CSV)
router.post('/import', async (req: Request, res: Response) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'CSV required' });
  const lines = csv.split('\n').slice(1);
  const results = [];
  for (const line of lines) {
    // Explicitly type the map parameter
    const [keyword, volume, kd, cpc, intent, city, car, difficulty] = line.split(',').map((s: string) => s?.trim());
    if (keyword) {
      const kw = await prisma.keyword.upsert({
        where: { keyword },
        update: { volume: Number(volume) || 0, kd: Number(kd) || 0, cpc: Number(cpc) || 0, intent, city, car, difficulty },
        create: { keyword, volume: Number(volume) || 0, kd: Number(kd) || 0, cpc: Number(cpc) || 0, intent, city, car, difficulty }
      });
      results.push(kw);
    }
  }
  res.json(results);
});

export default router;
