import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('institutions')
@Controller('institutions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InstitutionsController {
  constructor(private institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'List institutions with optional filters' })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: any) {
    return this.institutionsService.findAll(query);
  }

  @Get('by-aicte-id/:aicteId')
  @ApiOperation({ summary: 'Get institution profile by AICTE Permanent ID (AC-01)' })
  findByAicteId(@Param('aicteId') aicteId: string) {
    return this.institutionsService.findByAicteId(aicteId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get institution by UUID with all cases and overlaps' })
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }
}
