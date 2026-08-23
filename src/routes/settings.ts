import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'default' } });
  }
  res.json(settings);
});

router.put('/', async (req: Request, res: Response) => {
  const schema = z.object({
    siteName: z.string().optional(),
    logo: z.string().optional(),
    adsenseId: z.string().optional(),
    analyticsId: z.string().optional()
  });
  const data = schema.parse(req.body);
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: { id: 'default', ...data } });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data
    });
  }
  res.json(settings);
});

export default router;
