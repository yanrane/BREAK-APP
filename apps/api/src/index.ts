import 'dotenv/config';
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { requireAuth } from './middleware/requireAuth';
import { errorHandler } from './middleware/errorHandler';
import { startDailyMissionsCron } from './jobs/assignDailyMissions';

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Serve uploaded proof images — auth-protected (proof photos may contain personal data)
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
app.use('/uploads', requireAuth, express.static(uploadDir));

app.use('/api/v1', router);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  startDailyMissionsCron();
});

export default app;
