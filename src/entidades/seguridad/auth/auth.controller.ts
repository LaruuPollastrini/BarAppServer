import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SeguridadService } from '../seguridad.service';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly seguridadService: SeguridadService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @Request() req: Request & { user: { id: number } },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Post('request-password-reset')
  async requestPasswordReset(
    @Body() resetPasswordRequestDto: ResetPasswordRequestDto,
  ) {
    return this.authService.requestPasswordReset(resetPasswordRequestDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('modulos-accesibles')
  @UseGuards(AuthGuard('jwt'))
  async getModulosAccesibles(
    @Request() req: Request & { user: { id: number } },
  ) {
    return this.seguridadService.obtenerModulosAccesibles(req.user.id);
  }

  @Get('puede-acceder/:moduloNombre')
  @UseGuards(AuthGuard('jwt'))
  async puedeAccederModulo(
    @Request() req: Request & { user: { id: number } },
    @Param('moduloNombre') moduloNombre: string,
  ) {
    const puedeAcceder = await this.seguridadService.usuarioPuedeAccederModulo(
      req.user.id,
      moduloNombre,
    );
    return { puedeAcceder };
  }
}
