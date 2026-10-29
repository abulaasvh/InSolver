import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'a.rao@aicte.gov.in', description: 'User AICTE official email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Demo@1234', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
