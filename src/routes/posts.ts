import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { cache, clearCache } from '../lib/cache';

const router = Router();

const postSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().min(1),
  metaTitle: z.string().min(1),
  metaDesc: z.string().min(1),
  featuredImage: z.string().optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt: z.string().optional(),
  schemaJson: z.string().optional(),
  author: z.string().default('Mike Johnson')
});

// GET /api/posts?category=&status=
router.get('/', async (req: Request, res: Response) => {
  const { category, status = 'published' } = req.query;
  const cacheKey = `posts:${category || 'all'}:${status}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const where: any = { status: status as string };
  if (category) where.category = category;

  const posts = await prisma.post.findMany({
    where,
    select: {
      slug: true, title: true, excerpt: true, featuredImage: true,
      category: true, tags: true, publishedAt: true, viewCount: true,
      author: true, metaTitle: true, metaDesc: true, createdAt: true
    },
    orderBy: { publishedAt: 'desc' }
  });
  cache.set(cacheKey, posts, 300);
  res.json(posts);
});

// GET /api/posts/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const cacheKey = `post:${slug}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    // increment view count async
    prisma.post.update({ where: { slug }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return res.json(cached);
  }

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  cache.set(cacheKey, post, 3600);
  // increment view count async
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  res.json(post);
});

// POST /api/posts
router.post('/', async (req: Request, res: Response) => {
  const data = postSchema.parse(req.body);
  const post = await prisma.post.create({
    data: {
      ...data,
      publishedAt: data.status === 'published' ? new Date() : null
    }
  });
  clearCache('posts:');
  res.json(post);
});

// PUT /api/posts/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = postSchema.partial().parse(req.body);
  const post = await prisma.post.update({ where: { id }, data });
  clearCache('posts:');
  clearCache(`post:${post.slug}`);
  res.json(post);
});

// DELETE /api/posts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const post = await prisma.post.delete({ where: { id: req.params.id } });
  clearCache('posts:');
  clearCache(`post:${post.slug}`);
  res.json({ ok: true });
});

export default router;
