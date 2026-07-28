import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Endereço de email',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description:
      'Senha de acesso com pelo menos 8 caracteres, incluindo letra minúscula, maiúscula, número e caractere especial',
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/, {
    message:
      'Password must be at least 8 characters long and include lowercase, uppercase, number, and special character',
  })
  password!: string;

  @ApiProperty({ description: 'Nome de exibição', example: 'Mestre do Jogo' })
  @IsString()
  name!: string;
}
