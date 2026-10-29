import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    // Supervisor, management, admin have global visibility
    if (['admin', 'supervisor', 'management', 'auditor'].includes(user.role)) {
      return true;
    }

    const caseId = request.params.id || request.params.caseId;
    if (caseId) {
      const caseRecord = await this.prisma.case.findUnique({
        where: { id: caseId },
        include: { bureau: true, institution: true }
      });

      if (!caseRecord) {
        return true; // 404 will be handled by the controller
      }

      // Check Bureau Scope for Officers
      if (user.role === 'officer' && user.bureau_scope) {
        if (caseRecord.bureau && caseRecord.bureau.name !== user.bureau_scope) {
          throw new ForbiddenException(
            `Access denied. Case belongs to ${caseRecord.bureau.name}, but user scope is restricted to ${user.bureau_scope}.`
          );
        }
      }

      // Check Regional Scope
      if (user.role === 'regional' && user.region_scope) {
        if (caseRecord.institution && caseRecord.institution.region !== user.region_scope) {
          throw new ForbiddenException(
            `Access denied. Case is located in ${caseRecord.institution.region} region, but user scope is restricted to ${user.region_scope}.`
          );
        }
      }
    }

    return true;
  }
}
