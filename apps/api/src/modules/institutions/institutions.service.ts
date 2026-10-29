import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { region, search, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};

    if (region) where.region = region;
    if (search) {
      where.OR = [
        { canonical_name: { contains: search, mode: 'insensitive' } },
        { aicte_permanent_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.institution.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { canonical_name: 'asc' },
        include: {
          _count: { select: { cases: true } },
        },
      }),
      this.prisma.institution.count({ where }),
    ]);

    return { data, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async findByAicteId(aicteId: string) {
    const inst = await this.prisma.institution.findFirst({
      where: {
        OR: [
          { aicte_permanent_id: aicteId },
          { aliases: { has: aicteId } },
        ],
      },
      include: {
        cases: {
          orderBy: { received_at: 'desc' },
          include: {
            bureau: { select: { id: true, name: true } },
            officer: { select: { id: true, name: true } },
          },
        },
        _count: { select: { cases: true } },
      },
    });

    if (!inst) throw new NotFoundException(`Institution ${aicteId} not found`);
    return inst;
  }

  async findOne(id: string) {
    const inst = await this.prisma.institution.findUnique({
      where: { id },
      include: {
        cases: {
          orderBy: { received_at: 'desc' },
          include: {
            bureau: { select: { id: true, name: true } },
            officer: { select: { id: true, name: true } },
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
        },
        _count: { select: { cases: true } },
      },
    });

    if (!inst) throw new NotFoundException(`Institution ${id} not found`);
    return inst;
  }
}
