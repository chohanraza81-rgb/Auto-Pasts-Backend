import { Router, Request, Response } from 'express';
import { generateSitemapXML } from '../lib/sitemap';

const router = Router();

router.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const xml = await generateSitemapXML();
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    console.error('Sitemap generation error:', error);
    // Return the error message for debugging (remove in production)
    res.status(500).send(`Error generating sitemap: ${error.message || error}`);
  }
});

export default router;
