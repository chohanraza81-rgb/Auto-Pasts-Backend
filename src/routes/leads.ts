import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

// POST /api/leads
router.post('/', async (req: Request, res: Response) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().optional(),
    phone: z.string().optional(),
    source: z.string().min(1)
  });
  const data = schema.parse(req.body);
  const lead = await prisma.lead.create({ data });
  res.status(201).json(lead);
});

// GET /api/leads
router.get('/', async (req: Request, res: Response) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(leads);
});

// GET /api/leads/export
router.get('/export', async (req: Request, res: Response) => {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  const csv = [
    'Name,Email,Company,Phone,Source,Date',
    ...leads.map(l => `${l.name},${l.email},${l.company || ''},${l.phone || ''},${l.source},${l.createdAt.toISOString()}`)
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
  res.send(csv);
});

export default router;
