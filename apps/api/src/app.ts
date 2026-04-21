import 'dotenv/config';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { requireAuth } from './middleware/requireAuth';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Local-only: serve uploaded proof images from disk
// On Vercel, proof images are stored in Vercel Blob (public URLs)
if (!process.env.VERCEL) {
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
  app.use('/uploads', requireAuth, express.static(uploadDir));
}

app.get('/health', (_req, res) => { res.json({ ok: true }); });
app.use('/api/v1', router);
app.use(errorHandler);

export default app;
