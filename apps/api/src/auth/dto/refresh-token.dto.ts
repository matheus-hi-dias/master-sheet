import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token usado pelo cliente mobile.',
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  refreshToken?: string;
}
