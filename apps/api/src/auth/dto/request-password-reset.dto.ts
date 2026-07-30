import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'E-mail da conta que receberá o reset.' })
  @IsEmail()
  email: string;
}
