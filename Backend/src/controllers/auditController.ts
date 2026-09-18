import { Request, Response } from 'express';
import { AuditService } from '../services/AuditService';

export class AuditController {
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const { module, action, limit } = req.query;
      const filter: Record<string, any> = {};
      if (module) filter.module = module;
      if (action) filter.action = action;

      const logs = await AuditService.getLogs(limit ? Number(limit) : 100, filter);
      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
