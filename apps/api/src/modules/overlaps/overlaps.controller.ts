import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OverlapsService } from './overlaps.service';
import { ReviewOverlapDto } from './dto/review-overlap.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('overlaps')
@Controller('overlaps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OverlapsController {
  constructor(private overlapsService: OverlapsService) {}

  @Get()
  @ApiOperation({ summary: 'List overlap relationships (optionally filter by institution)' })
  @ApiQuery({ name: 'institutionId', required: false })
  findAll(@Query('institutionId') institutionId?: string) {
    return this.overlapsService.findAll(institutionId);
  }

  @Post(':id/review')
  @UseGuards(RolesGuard)
  @Roles('supervisor', 'management', 'admin')
  @ApiOperation({ summary: 'Review overlap: confirm, reject or defer. Requires reason to reject.' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewOverlapDto,
    @CurrentUser() user: any,
  ) {
    return this.overlapsService.review(id, dto.action, user.id, dto.reason);
  }

  @Post('run-detection')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Run overlap detection algorithm (admin/supervisor only)' })
  @ApiQuery({ name: 'institutionId', required: false })
  runDetection(@Query('institutionId') institutionId?: string) {
    return this.overlapsService.runDetection(institutionId).then((count) => ({
      message: `Overlap detection completed. ${count} new relationships created.`,
      new_relationships: count,
    }));
  }
}
