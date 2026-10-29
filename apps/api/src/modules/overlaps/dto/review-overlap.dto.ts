import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewOverlapDto {
  @ApiProperty({ enum: ['confirmed', 'rejected', 'deferred'] })
  @IsIn(['confirmed', 'rejected', 'deferred'])
  action: 'confirmed' | 'rejected' | 'deferred';

  @ApiPropertyOptional({ example: 'Different issue, handled separately' })
  @IsOptional()
  @IsString()
  reason?: string;
}
