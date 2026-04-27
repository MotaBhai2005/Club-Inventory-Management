import prisma from '../config/prisma';

export class SystemService {
  static async getAuditLogs() {
    return await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { username: true } } }
    });
  }

  static async logAction(userId: number, action: string, entity: string, entityId?: number, details?: string) {
    return await prisma.auditLog.create({
      data: { userId, action, entity, entityId, details }
    });
  }
}
