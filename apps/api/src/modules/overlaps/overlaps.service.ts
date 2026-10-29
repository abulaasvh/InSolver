import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OverlapsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(institutionId?: string) {
    const where: any = {};
    if (institutionId) {
      where.OR = [
        { case_a: { institution_id: institutionId } },
        { case_b: { institution_id: institutionId } },
      ];
    }

    return this.prisma.caseRelationship.findMany({
      where,
      orderBy: [{ review_status: 'asc' }, { score: 'desc' }],
      include: {
        case_a: {
          include: {
            bureau: true,
            institution: { select: { canonical_name: true, aicte_permanent_id: true } },
          },
        },
        case_b: {
          include: {
            bureau: true,
            institution: { select: { canonical_name: true, aicte_permanent_id: true } },
          },
        },
        reviewer: { select: { id: true, name: true } },
      },
    });
  }

  async review(
    relationshipId: string,
    action: 'confirmed' | 'rejected' | 'deferred',
    actorId: string,
    reason?: string,
  ) {
    const relationship = await this.prisma.caseRelationship.findUnique({
      where: { id: relationshipId },
      include: { case_a: true, case_b: true },
    });

    if (!relationship) {
      throw new NotFoundException(`Overlap relationship ${relationshipId} not found`);
    }

    if (action === 'rejected' && !reason) {
      throw new BadRequestException('A reason is required when rejecting a relationship');
    }

    // Update relationship - never delete (AC-05)
    const updated = await this.prisma.caseRelationship.update({
      where: { id: relationshipId },
      data: {
        review_status: action,
        reviewed_by: actorId,
        reviewed_at: new Date(),
        reason: reason || null,
      },
      include: {
        case_a: { include: { bureau: true } },
        case_b: { include: { bureau: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    // Create case events for both cases
    await this.prisma.caseEvent.createMany({
      data: [
        {
          case_id: relationship.case_a_id,
          actor_id: actorId,
          event_type: 'link_action',
          remarks: `Overlap with ${relationship.case_b.case_code} — ${action}${reason ? `: ${reason}` : ''}`,
        },
        {
          case_id: relationship.case_b_id,
          actor_id: actorId,
          event_type: 'link_action',
          remarks: `Overlap with ${relationship.case_a.case_code} — ${action}${reason ? `: ${reason}` : ''}`,
        },
      ],
    });

    // Audit log (AC-05 compliance)
    await this.audit.logEvent(
      actorId,
      `link.${action}`,
      'case_relationship',
      relationshipId,
      {
        case_a: relationship.case_a.case_code,
        case_b: relationship.case_b.case_code,
        action,
        reason,
      },
    );

    return updated;
  }

  async runDetection(institutionId?: string): Promise<number> {
    const where: any = { status: { in: ['New', 'Under Process'] } };
    if (institutionId) where.institution_id = institutionId;

    const cases = await this.prisma.case.findMany({
      where,
      include: { bureau: true },
    });

    let created = 0;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const a = cases[i];
        const b = cases[j];

        // Only within same institution (AC-03 requirement)
        if (a.institution_id !== b.institution_id) continue;
        // Only across different bureaus/cells
        if (a.bureau_id === b.bureau_id) continue;
        // Must have bureaus assigned
        if (!a.bureau_id || !b.bureau_id) continue;

        // Check if relationship already exists
        const exists = await this.prisma.caseRelationship.findFirst({
          where: {
            OR: [
              { case_a_id: a.id, case_b_id: b.id },
              { case_a_id: b.id, case_b_id: a.id },
            ],
          },
        });
        if (exists) continue;

        // Scoring
        let score = 0.4; // Base: same institution
        const reasons: any[] = [
          { label: 'Same institution ID', detail: `Institution: ${a.institution_id}` },
        ];

        // Subject similarity (simple keyword overlap as trigram substitute)
        const aWords = new Set(a.subject.toLowerCase().split(/\s+/));
        const bWords = new Set(b.subject.toLowerCase().split(/\s+/));
        const intersection = [...aWords].filter((w) => bWords.has(w) && w.length > 3);
        if (intersection.length >= 2) {
          score += 0.3;
          reasons.push({ label: 'Similar subject', detail: `Common terms: ${intersection.join(', ')}` });
        }

        // Date proximity
        const dateDiff = Math.abs(
          new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
        );
        if (dateDiff < thirtyDays) {
          score += 0.2;
          reasons.push({ label: 'Close dates', detail: `Received within 30 days of each other` });
        }

        // Same category bonus
        if (a.category === b.category) {
          score += 0.1;
          reasons.push({ label: 'Same category', detail: a.category });
        }

        if (score >= 0.4) {
          const confidenceBand =
            score >= 0.75 ? 'High' : score >= 0.5 ? 'Medium' : 'Low';

          await this.prisma.caseRelationship.create({
            data: {
              case_a_id: a.id,
              case_b_id: b.id,
              relationship_type: 'cross_cell_overlap',
              confidence_band: confidenceBand,
              score,
              reasons,
              review_status: 'suggested',
            },
          });
          created++;
        }
      }
    }

    return created;
  }
}
