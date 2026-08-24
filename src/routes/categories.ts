import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

router.post('/', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
  });
  const data = schema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const schema = z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  });
  const data = schema.parse(req.body);
  const category = await prisma.category.update({ where: { id }, data });
  res.json(category);
});

router.delete('/:id', async (req: Request, res: Response) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
