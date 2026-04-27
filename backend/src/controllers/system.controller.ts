import { Request, Response } from 'express';
import { SystemService } from '../services/system.service';

export class SystemController {
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const logs = await SystemService.getAuditLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
