import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetCurrentUser } from './decorators/get-user.decorator';
import type { ActiveUser } from './types/auth.types';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário no sistema.' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
  @ApiResponse({ status: 409, description: 'E-mail indisponível.' })
  @UsePipes(ValidationPipe)
  async register(@Body() user: RegisterDto) {
    return this.authService.register(user);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autentica o usuário e retorna o token JWT.' })
  @ApiResponse({ status: 201, description: 'Login feito com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @UsePipes(ValidationPipe)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recupera as informações do usuário atual (logado).',
  })
  @ApiResponse({ status: 200, description: 'Usuário atual.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado.' })
  getMe(@GetCurrentUser() user: ActiveUser) {
    return user;
  }
}
