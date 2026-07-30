import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token único para verificação de e-mail.' })
  @IsString()
  @MinLength(16)
  token: string;
}
