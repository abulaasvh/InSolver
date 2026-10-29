import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Response } from 'express';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated statistics for the reports dashboard' })
  @ApiQuery({ name: 'institution_id', required: false })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'bureau', required: false })
  @ApiQuery({ name: 'status', required: false })
  getStats(@Query() query: any) {
    return this.reportsService.getStats(query);
  }

  @Get('export-csv')
  @ApiOperation({ summary: 'Export cases as CSV (action logged in audit trail)' })
  async exportCsv(@Query() query: any, @CurrentUser() user: any, @Res() res: Response) {
    const { csv, filename, count } = await this.reportsService.exportCsv(query, user.id);
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.header('X-Row-Count', String(count));
    res.send(csv);
  }
}
