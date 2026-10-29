import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BureausService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.bureau.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }
}
