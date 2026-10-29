import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logEvent(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.auditEvent.create({
      data: {
        actor_id: actorId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        metadata: metadata || {},
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getAuditTrail(entityType?: string, entityId?: string) {
    const where: any = {};
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;

    return this.prisma.auditEvent.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
