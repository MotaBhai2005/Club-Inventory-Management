import app from './app';
import { startCronJobs } from './jobs/cron';
import { env } from './config/env';

const startServer = async () => {
  try {
    // Start the cron jobs
    await startCronJobs();

    // Start Express server
    app.listen(env.PORT, () => {
      console.log(`TS Backend server running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();
