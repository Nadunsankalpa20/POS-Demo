import { AuditLog } from '../models/AuditLog';

interface LogOptions {
  userId?: any;
  userName?: string;
  userRole?: string;
  action: string;
  module: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  static async log(options: LogOptions): Promise<void> {
    try {
      await AuditLog.create({
        userId: options.userId,
        userName: options.userName || 'System',
        userRole: options.userRole || '',
        action: options.action,
        module: options.module,
        description: options.description,
        details: options.details || {},
        ipAddress: options.ipAddress || '127.0.0.1',
      });
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
    }
  }

  static async getLogs(limit: number = 100, filter: Record<string, any> = {}) {
    return AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit);
  }
}
