import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mikesauto.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'securepassword123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: hashedPassword, name: 'Mike Johnson' }
  });

  // Seed posts
  const postsPath = path.join(__dirname, '../../frontend/seeds/posts.json');
  if (fs.existsSync(postsPath)) {
    const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    for (const post of posts) {
      await prisma.post.upsert({
        where: { slug: post.slug },
        update: post,
        create: post
      });
    }
    console.log(`Seeded ${posts.length} posts`);
  }

  // Seed keywords
  const keywordsPath = path.join(__dirname, '../../frontend/seeds/keywords.json');
  if (fs.existsSync(keywordsPath)) {
    const keywords = JSON.parse(fs.readFileSync(keywordsPath, 'utf-8'));
    for (const kw of keywords) {
      await prisma.keyword.upsert({
        where: { keyword: kw.keyword },
        update: kw,
        create: kw
      });
    }
    console.log(`Seeded ${keywords.length} keywords`);
  }

  // Seed settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default', siteName: "Mike's Auto Garage" }
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
