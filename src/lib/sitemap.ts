import { prisma } from './prisma';

export async function generateSitemapXML(): Promise<string> {
  const baseUrl = process.env.FRONTEND_URL || 'https://your-domain.vercel.app';
  const posts = await prisma.post.findMany({
    where: { status: 'published' },
    select: { slug: true, publishedAt: true }
  });

  // Explicitly type the map parameter to avoid implicit any
  const postUrls = posts.map((p: { slug: string; publishedAt: Date | null }) => `
    <url>
      <loc>${baseUrl}/blog/${p.slug}</loc>
      <lastmod>${p.publishedAt?.toISOString() || new Date().toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`).join('');

  // Programmatic pages (example: 2000 pages)
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'bmw'];
  const models = ['corolla', 'civic', 'f150', 'silverado', '3-series'];
  const years = ['2020', '2021', '2022', '2023', '2024'];
  const parts = ['brake-pads', 'oil-filter', 'air-filter', 'spark-plugs'];
  const cities = ['toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'];
  let programmaticUrls = '';
  for (const make of makes) {
    for (const model of models) {
      for (const year of years) {
        for (const part of parts) {
          for (const city of cities) {
            programmaticUrls += `
    <url>
      <loc>${baseUrl}/${make}-${model}-${year}-${part}-in-${city}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.6</priority>
    </url>`;
          }
        }
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}</loc><priority>1.0</url>
  ${postUrls}
  ${programmaticUrls}
</urlset>`;
}
