import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getStats(query: any) {
    const { institution_id, region, bureau, status } = query;

    const where: any = {};
    if (institution_id) where.institution_id = institution_id;
    if (region) where.institution = { region };
    if (status) where.status = status;
    if (bureau) {
      const bureauRecord = await this.prisma.bureau.findFirst({ where: { name: bureau } });
      if (bureauRecord) where.bureau_id = bureauRecord.id;
    }

    const [allCases, bureaus] = await Promise.all([
      this.prisma.case.findMany({
        where,
        include: {
          bureau: true,
          institution: { select: { region: true } },
        },
      }),
      this.prisma.bureau.findMany({ where: { active: true } }),
    ]);

    const now = new Date();

    // Cases by Bureau/Cell
    const byBureau = bureaus.map((b) => ({
      bureau: b.name,
      open: allCases.filter(
        (c) => c.bureau_id === b.id && !['Disposed', 'Transferred'].includes(c.status),
      ).length,
      total: allCases.filter((c) => c.bureau_id === b.id).length,
    }));

    // Cases by Status
    const statuses = ['New', 'Under Process', 'Transferred', 'Disposed', 'Overdue'];
    const byStatus = statuses.map((s) => ({
      status: s,
      count: allCases.filter((c) => c.status === s).length,
    }));

    // Ageing Buckets
    const ageing = {
      '0-15': 0,
      '16-30': 0,
      '31-60': 0,
      '60+': 0,
    };

    allCases
      .filter((c) => !['Disposed'].includes(c.status))
      .forEach((c) => {
        const days = Math.floor(
          (now.getTime() - new Date(c.received_at).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (days <= 15) ageing['0-15']++;
        else if (days <= 30) ageing['16-30']++;
        else if (days <= 60) ageing['31-60']++;
        else ageing['60+']++;
      });

    // By Region
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const byRegion = regions.map((r) => ({
      region: r,
      count: allCases.filter((c) => c.institution?.region === r).length,
    }));

    return {
      total_cases: allCases.length,
      open_cases: allCases.filter((c) => !['Disposed'].includes(c.status)).length,
      overdue_cases: allCases.filter((c) => c.status === 'Overdue').length,
      by_bureau: byBureau,
      by_status: byStatus,
      by_region: byRegion,
      ageing_buckets: Object.entries(ageing).map(([bucket, count]) => ({ bucket, count })),
      synthetic: true,
    };
  }

  async exportCsv(query: any, actorId: string) {
    const { institution_id, region, bureau, status } = query;

    const where: any = {};
    if (institution_id) where.institution_id = institution_id;
    if (region) where.institution = { region };
    if (status) where.status = status;
    if (bureau) {
      const bureauRecord = await this.prisma.bureau.findFirst({ where: { name: bureau } });
      if (bureauRecord) where.bureau_id = bureauRecord.id;
    }

    const cases = await this.prisma.case.findMany({
      where,
      include: {
        institution: { select: { canonical_name: true, aicte_permanent_id: true, region: true } },
        bureau: true,
        officer: { select: { name: true } },
      },
      orderBy: { received_at: 'desc' },
    });

    // Log export audit (AC-12)
    await this.prisma.auditEvent.create({
      data: {
        actor_id: actorId,
        action: 'export.csv',
        entity_type: 'report',
        entity_id: 'all',
        metadata: { filters: query, row_count: cases.length },
      },
    });

    const header = [
      'Case Code', 'Institution', 'AICTE ID', 'Region', 'Subject', 'Category',
      'Status', 'Bureau/Cell', 'Officer', 'Received At', 'Due At', 'Source System', 'Synced At'
    ];

    const rows = cases.map((c) => [
      c.case_code,
      c.institution?.canonical_name || '',
      c.institution?.aicte_permanent_id || '',
      c.institution?.region || '',
      `"${c.subject.replace(/"/g, '""')}"`,
      c.category,
      c.status,
      c.bureau?.name || 'Unassigned',
      c.officer?.name || 'Unassigned',
      c.received_at.toISOString().split('T')[0],
      c.due_at ? c.due_at.toISOString().split('T')[0] : '',
      c.source_system,
      c.synced_at.toISOString(),
    ]);

    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    return { csv, filename: `insolver-export-${Date.now()}.csv`, count: cases.length };
  }
}
