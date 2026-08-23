import { Router, Request, Response } from 'express';

const router = Router();

router.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${process.env.FRONTEND_URL || 'https://your-domain.vercel.app'}/sitemap.xml`);
});

export default router;
