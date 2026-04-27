import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import inventoryRoutes from './routes/inventory.routes';
import { lendingsRouter, historyRouter } from './routes/lendings.routes';
import metricsRoutes from './routes/metrics.routes';
import usersRoutes from './routes/users.routes';
import systemRoutes from './routes/system.routes';
import projectsRoutes from './routes/projects.routes';
import requestsRoutes from './routes/requests.routes';
import path from 'path';

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL;
app.use(cors({
  origin: FRONTEND_URL ? [FRONTEND_URL, 'http://localhost:3000'] : '*',
}));
app.use(express.json());

// Serve static files (like uploaded images)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', authRoutes); // mounts /api/signup and /api/login
app.use('/api/users', usersRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/lendings', lendingsRouter);
app.use('/api/history', historyRouter);
app.use('/api/metrics', metricsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/requests', requestsRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
});

export default app;
