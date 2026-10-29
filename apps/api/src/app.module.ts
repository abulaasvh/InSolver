import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { BureausModule } from './modules/bureaus/bureaus.module';
import { CasesModule } from './modules/cases/cases.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { OverlapsModule } from './modules/overlaps/overlaps.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AuthModule,
    BureausModule,
    CasesModule,
    InstitutionsModule,
    OverlapsModule,
    ReportsModule,
  ],
})
export class AppModule {}
