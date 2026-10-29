import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { RegisterCaseDto, UpdateCaseDto, ConfirmRoutingDto } from './dto/case.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ScopeGuard } from '../../common/guards/scope.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'List cases with filters (bureau, region, status, search)' })
  @ApiQuery({ name: 'bureau', required: false })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'institution_id', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.casesService.findAll(query, user);
  }

  @Get('my-queue')
  @ApiOperation({ summary: 'Get cases in my queue (officer only)' })
  myQueue(@CurrentUser() user: any) {
    return this.casesService.getMyQueue(user.id);
  }

  @Get('alerts/unread')
  @ApiOperation({ summary: 'Get unread alerts for the current user' })
  unreadAlerts(@CurrentUser() user: any) {
    return this.casesService.getUnreadAlerts(user.id);
  }

  @Get('by-code/:caseCode')
  @ApiOperation({ summary: 'Get case by case code (e.g. CASE-0136)' })
  findByCaseCode(@Param('caseCode') caseCode: string) {
    return this.casesService.findByCaseCode(caseCode);
  }

  @Get(':id')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Get single case by UUID (scope-enforced)' })
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('supervisor', 'officer', 'management', 'admin', 'regional')
  @ApiOperation({ summary: 'Register a new case (supervisor/officer role required)' })
  register(@Body() dto: RegisterCaseDto, @CurrentUser() user: any) {
    return this.casesService.register(dto, user.id);
  }

  @Post(':id/confirm-routing')
  @UseGuards(RolesGuard)
  @Roles('supervisor', 'management', 'admin')
  @ApiOperation({ summary: 'Confirm routing suggestion for a case (supervisor required)' })
  confirmRouting(
    @Param('id') id: string,
    @Body() dto: ConfirmRoutingDto,
    @CurrentUser() user: any,
  ) {
    return this.casesService.confirmRouting(id, dto, user.id);
  }

  @Get(':id/routing-suggestion')
  @ApiOperation({ summary: 'Get routing suggestion for case without confirming' })
  getRoutingSuggestion(@Param('id') id: string) {
    return this.casesService.getRoutingSuggestion(id);
  }

  @Patch(':id')
  @UseGuards(ScopeGuard)
  @ApiOperation({ summary: 'Update case fields (status, owner, next action, deadline)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCaseDto,
    @CurrentUser() user: any,
  ) {
    return this.casesService.update(id, dto, user.id);
  }
}
