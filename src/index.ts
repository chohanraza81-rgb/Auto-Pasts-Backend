import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { authenticateAdmin } from './middleware/auth';
import { generateToken } from './middleware/auth';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

import postsRouter from './routes/posts';
import keywordsRouter from './routes/keywords';
import affiliatesRouter from './routes/affiliates';
import leadsRouter from './routes/leads';
import generateRouter from './routes/generate';
import sitemapRouter from './routes/sitemap';
import settingsRouter from './routes/settings';
import robotsRouter from './routes/robots';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(s => s.trim());

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Fix express-rate-limit trust proxy warning
app.set('trust proxy', 1);

app.use('/api', apiLimiter);

// Public routes
app.use('/api/posts', postsRouter);
app.use('/api/keywords', keywordsRouter);
app.use('/api/affiliates', affiliatesRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/generate', generateRouter);
app.use('/', sitemapRouter);
app.use('/', robotsRouter);
app.use('/api/settings', settingsRouter);

// Admin login route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(admin.email);
  res.json({ token, admin: { email: admin.email, name: admin.name } });
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔧 Mike's backend running on port ${PORT}`);
});
