import app from './app';
import { startDailyMissionsCron } from './jobs/assignDailyMissions';

const PORT = process.env.PORT ?? 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    startDailyMissionsCron();
  });
}

export default app;
