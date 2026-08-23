import { Router, Request, Response } from 'express';
import { generateSitemapXML } from '../lib/sitemap';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const xml = await generateSitemapXML();
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

export default router;
