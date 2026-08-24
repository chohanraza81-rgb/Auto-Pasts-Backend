router.get('/', async (req: Request, res: Response) => {
  const { category, status = 'published' } = req.query;
  const where: any = {};
  if (status !== 'all') {
    where.status = status as string;
  }
  if (category && category !== 'all') {
    where.category = category as string;
  }

  const cacheKey = `posts:${category || 'all'}:${status || 'all'}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  const posts = await prisma.post.findMany({
    where,
    select: {
      slug: true, title: true, excerpt: true, featuredImage: true,
      category: true, tags: true, publishedAt: true, viewCount: true,
      author: true, metaTitle: true, metaDesc: true, createdAt: true,
      status: true   // <-- ensure this is here
    },
    orderBy: { publishedAt: 'desc' }
  });
  cache.set(cacheKey, posts, 300);
  res.json(posts);
});
