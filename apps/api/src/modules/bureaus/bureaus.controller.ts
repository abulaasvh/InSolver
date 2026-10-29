import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BureausService } from './bureaus.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('bureaus')
@Controller('bureaus')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BureausController {
  constructor(private bureausService: BureausService) {}

  @Get()
  @ApiOperation({ summary: 'List all active Bureaus and Cells' })
  findAll() {
    return this.bureausService.findAll();
  }
}
