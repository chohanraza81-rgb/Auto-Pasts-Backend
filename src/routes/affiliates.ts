import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// GET /api/affiliates
router.get('/', async (req: Request, res: Response) => {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { clicks: 'desc' }
  });
  res.json(affiliates);
});

// POST /api/affiliates
router.post('/', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    url: z.string().url(),
    cloakSlug: z.string().min(1),
    network: z.string().min(1)
  });
  const data = schema.parse(req.body);
  const aff = await prisma.affiliate.create({ data });
  res.status(201).json(aff);
});

// GET /api/affiliates/go/:slug (redirect + track)
router.get('/go/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const aff = await prisma.affiliate.findUnique({ where: { cloakSlug: slug } });
  if (!aff) return res.status(404).json({ error: 'Affiliate not found' });
  await prisma.affiliate.update({ where: { id: aff.id }, data: { clicks: { increment: 1 } } });
  res.redirect(301, aff.url);
});

// DELETE /api/affiliates/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.affiliate.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
