import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'Token único de reset de senha.' })
  @IsString()
  @MinLength(16)
  token: string;

  @ApiProperty({
    description: 'Nova senha da conta.',
    example: 'new-password-123',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
