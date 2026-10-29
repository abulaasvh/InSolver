import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterCaseDto, UpdateCaseDto, ConfirmRoutingDto } from './dto/case.dto';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private generateCaseCode(): string {
    const randomNum = Math.floor(100 + Math.random() * 9000);
    return `CASE-${randomNum.toString().padStart(4, '0')}`;
  }

  private calculateConfidenceBand(score: number): string {
    if (score >= 0.75) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  }

  async findAll(query: any, user: any) {
    const { bureau, region, status, institution_id, search, sort = 'received_at', order = 'desc', page = 1, limit = 50 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = {};

    // Enforce scope
    if (user.role === 'officer' && user.bureau_scope) {
      const bureauRecord = await this.prisma.bureau.findFirst({
        where: { name: user.bureau_scope },
      });
      if (bureauRecord) {
        where.bureau_id = bureauRecord.id;
      }
    }

    if (user.role === 'regional' && user.region_scope) {
      where.institution = { region: user.region_scope };
    }

    // Apply filters
    if (bureau && bureau !== 'all') {
      const bureauRecord = await this.prisma.bureau.findFirst({ where: { name: bureau } });
      if (bureauRecord) where.bureau_id = bureauRecord.id;
    }

    if (region && region !== 'all') {
      where.institution = { ...where.institution, region };
    }

    if (status && status !== 'all') {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    if (institution_id) {
      where.institution_id = institution_id;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { case_code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cases, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: {
          institution: {
            select: { id: true, canonical_name: true, aicte_permanent_id: true, region: true },
          },
          bureau: { select: { id: true, name: true, type: true } },
          officer: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.case.count({ where }),
    ]);

    return {
      data: cases,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  async findOne(id: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { id },
      include: {
        institution: true,
        bureau: true,
        officer: { select: { id: true, name: true, email: true, role: true } },
        events: {
          orderBy: { created_at: 'desc' },
          include: {
            actor: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        alerts: {
          where: { resolved_at: null },
          include: {
            recipient: { select: { id: true, name: true } },
          },
        },
        relationships_as_a: {
          include: {
            case_b: {
              include: { bureau: true, institution: { select: { canonical_name: true } } },
            },
            reviewer: { select: { id: true, name: true } },
          },
        },
        relationships_as_b: {
          include: {
            case_a: {
              include: { bureau: true, institution: { select: { canonical_name: true } } },
            },
            reviewer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!caseRecord) throw new NotFoundException(`Case ${id} not found`);
    return caseRecord;
  }

  async findByCaseCode(caseCode: string) {
    const caseRecord = await this.prisma.case.findUnique({
      where: { case_code: caseCode },
      include: {
        institution: true,
        bureau: true,
        officer: { select: { id: true, name: true, email: true, role: true } },
        events: {
          orderBy: { created_at: 'desc' },
          include: {
            actor: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        alerts: {
          where: { resolved_at: null },
        },
        relationships_as_a: {
          include: {
            case_b: { include: { bureau: true } },
            reviewer: { select: { id: true, name: true } },
          },
        },
        relationships_as_b: {
          include: {
            case_a: { include: { bureau: true } },
            reviewer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!caseRecord) throw new NotFoundException(`Case ${caseCode} not found`);
    return caseRecord;
  }

  async register(dto: RegisterCaseDto, actorId: string) {
    // 1. Institution matching: exact AICTE ID first
    const institution = await this.prisma.institution.findUnique({
      where: { aicte_permanent_id: dto.aicte_permanent_id },
    });

    if (!institution) {
      throw new NotFoundException(
        `Institution with AICTE ID '${dto.aicte_permanent_id}' not found. Check ID or contact admin for alias mapping.`,
      );
    }

    const sourceSystem = dto.source_system || 'MANUAL';
    const sourceCaseId = dto.source_case_id || `MANUAL-${Date.now()}`;

    // Idempotency check (AC-10)
    const existing = await this.prisma.case.findUnique({
      where: { source_system_source_case_id: { source_system: sourceSystem, source_case_id: sourceCaseId } },
    });

    if (existing) {
      return { message: 'Case already exists (idempotent)', case: existing, duplicate: true };
    }

    // 2. Generate case code
    let caseCode = this.generateCaseCode();
    let attempts = 0;
    while (attempts < 10) {
      const exists = await this.prisma.case.findUnique({ where: { case_code: caseCode } });
      if (!exists) break;
      caseCode = this.generateCaseCode();
      attempts++;
    }

    // 3. Apply keyword routing rules (Rules first, AI second)
    const routingSuggestion = await this.suggestRouting(dto.subject);

    // 4. Create case
    const newCase = await this.prisma.case.create({
      data: {
        case_code: caseCode,
        source_system: sourceSystem,
        source_case_id: sourceCaseId,
        institution_id: institution.id,
        subject: dto.subject,
        category: routingSuggestion?.suggested_category || 'Uncategorized',
        status: 'New',
        bureau_id: null, // Not confirmed until supervisor approves
        received_at: dto.received_at ? new Date(dto.received_at) : new Date(),
        synced_at: new Date(),
      },
      include: { institution: true, bureau: true },
    });

    // 5. Audit log
    await this.audit.logEvent(actorId, 'case.register', 'case', newCase.id, {
      case_code: caseCode,
      institution: institution.aicte_permanent_id,
      source_system: sourceSystem,
    });

    // 6. Create case event
    await this.prisma.caseEvent.create({
      data: {
        case_id: newCase.id,
        actor_id: actorId,
        event_type: 'case_registered',
        remarks: `Case registered for ${institution.canonical_name}`,
      },
    });

    return {
      case: newCase,
      routing_suggestion: routingSuggestion,
      duplicate: false,
    };
  }

  async suggestRouting(subject: string) {
    const rules = await this.prisma.routingRule.findMany({
      where: { active: true },
      orderBy: { priority: 'desc' },
      include: { bureau: true },
    });

    const lowerSubject = subject.toLowerCase();

    for (const rule of rules) {
      const matched = rule.keywords.some((kw) => lowerSubject.includes(kw.toLowerCase()));
      if (matched) {
        const matchedKws = rule.keywords.filter((kw) => lowerSubject.includes(kw.toLowerCase()));
        return {
          suggested_category: rule.category,
          suggested_bureau_id: rule.bureau_id,
          suggested_bureau_name: rule.bureau.name,
          why: `Keyword match + category rule`,
          rules_checked: ['Subject', 'Category', 'Region'],
          matched_keywords: matchedKws,
          matched_rule_id: rule.id,
        };
      }
    }

    return null; // No match - stays unrouted
  }

  async confirmRouting(caseId: string, dto: ConfirmRoutingDto, actorId: string) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException(`Case ${caseId} not found`);

    const bureau = await this.prisma.bureau.findUnique({ where: { id: dto.bureau_id } });
    if (!bureau) throw new NotFoundException(`Bureau ${dto.bureau_id} not found`);

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: {
        bureau_id: dto.bureau_id,
        category: dto.category,
        status: 'Under Process',
        last_action: `Routing confirmed: assigned to ${bureau.name}`,
        last_action_at: new Date(),
      },
      include: { bureau: true, institution: true },
    });

    await this.audit.logEvent(actorId, 'routing.confirm', 'case', caseId, {
      case_code: caseRecord.case_code,
      bureau: bureau.name,
      category: dto.category,
      remarks: dto.remarks,
    });

    await this.prisma.caseEvent.create({
      data: {
        case_id: caseId,
        actor_id: actorId,
        event_type: 'routing_confirmed',
        remarks: `Routing confirmed: ${dto.category} → ${bureau.name}. ${dto.remarks || ''}`.trim(),
      },
    });

    return updated;
  }

  async update(id: string, dto: UpdateCaseDto, actorId: string) {
    const existing = await this.prisma.case.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Case ${id} not found`);

    const changes: string[] = [];
    if (dto.status && dto.status !== existing.status) {
      changes.push(`Status: ${existing.status} → ${dto.status}`);
    }
    if (dto.officer_id && dto.officer_id !== existing.officer_id) {
      const officer = await this.prisma.user.findUnique({ where: { id: dto.officer_id } });
      changes.push(`Owner assigned: ${officer?.name || dto.officer_id}`);
    }

    const updated = await this.prisma.case.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.officer_id !== undefined && { officer_id: dto.officer_id }),
        ...(dto.next_action && { next_action: dto.next_action }),
        ...(dto.due_at && { due_at: new Date(dto.due_at) }),
        ...(dto.coordination_note !== undefined && { coordination_note: dto.coordination_note }),
        ...(dto.lead_team !== undefined && { lead_team: dto.lead_team }),
        last_action_at: new Date(),
        synced_at: new Date(),
      },
      include: { bureau: true, institution: true, officer: { select: { id: true, name: true } } },
    });

    if (changes.length > 0) {
      await this.audit.logEvent(actorId, 'case.update', 'case', id, {
        case_code: existing.case_code,
        changes,
      });

      await this.prisma.caseEvent.create({
        data: {
          case_id: id,
          actor_id: actorId,
          event_type: dto.status ? 'status_change' : 'note_added',
          remarks: changes.join('; '),
        },
      });
    }

    return updated;
  }

  async getMyQueue(userId: string) {
    return this.prisma.case.findMany({
      where: {
        officer_id: userId,
        status: { in: ['New', 'Under Process', 'Overdue'] },
      },
      orderBy: [{ status: 'asc' }, { due_at: 'asc' }],
      include: {
        institution: { select: { canonical_name: true } },
        bureau: { select: { name: true } },
      },
      take: 20,
    });
  }

  async getUnreadAlerts(userId: string) {
    return this.prisma.alert.findMany({
      where: { recipient_id: userId, resolved_at: null },
      include: {
        case: { select: { case_code: true, subject: true, status: true } },
      },
      orderBy: { triggered_at: 'desc' },
    });
  }

  async getRoutingSuggestion(caseId: string) {
    const caseRecord = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseRecord) throw new NotFoundException(`Case ${caseId} not found`);
    return this.suggestRouting(caseRecord.subject);
  }
}
