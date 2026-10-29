import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class RegisterCaseDto {
  @ApiProperty({ example: 'DEMO-1042', description: 'AICTE Permanent Institution ID' })
  @IsString()
  @IsNotEmpty()
  aicte_permanent_id: string;

  @ApiProperty({ example: 'Fee refund not processed after withdrawal' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiPropertyOptional({ example: 'PGRC_PORTAL' })
  @IsOptional()
  @IsString()
  source_system?: string;

  @ApiPropertyOptional({ example: 'SRC-PGRC-9999' })
  @IsOptional()
  @IsString()
  source_case_id?: string;

  @ApiPropertyOptional({ example: '2026-10-29' })
  @IsOptional()
  @IsDateString()
  received_at?: string;
}

export class UpdateCaseDto {
  @ApiPropertyOptional({ description: 'Case status', enum: ['New', 'Under Process', 'Transferred', 'Disposed', 'Overdue'] })
  @IsOptional()
  @IsIn(['New', 'Under Process', 'Transferred', 'Disposed', 'Overdue'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  officer_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next_action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coordination_note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lead_team?: string;
}

export class ConfirmRoutingDto {
  @ApiProperty({ description: 'Bureau/Cell UUID to assign' })
  @IsUUID()
  bureau_id: string;

  @ApiProperty({ example: 'Fee Dispute' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ example: 'Optional remarks from supervisor' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ListCasesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bureau?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}
