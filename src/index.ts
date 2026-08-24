import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { prisma } from './lib/prisma';

import postsRouter from './routes/posts';
import keywordsRouter from './routes/keywords';
import affiliatesRouter from './routes/affiliates';
import leadsRouter from './routes/leads';
import generateRouter from './routes/generate';
import sitemapRouter from './routes/sitemap';
import settingsRouter from './routes/settings';
import robotsRouter from './routes/robots';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy to fix express-rate-limit X-Forwarded-For warning on Railway
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
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔧 Mike's backend running on port ${PORT}`);
});
