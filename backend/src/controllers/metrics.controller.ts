import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

export class MetricsController {
  static async getMetrics(req: Request, res: Response) {
    try {
      const metrics = await MetricsService.getMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
