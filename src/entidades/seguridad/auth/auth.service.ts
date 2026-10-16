import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.entity';
import { RefreshToken } from './refresh-token.entity';
import { Grupo } from '../grupos/grupos.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { TipoEventoSesion } from '../auditoria/auditoria-sesion.entity';
import { SeguridadService } from '../seguridad.service';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ResetPasswordRequestDto,
  ResetPasswordDto,
  RefreshTokenDto,
  AuthResponseDto,
} from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private seguridadService: SeguridadService,
    private auditoriaService: AuditoriaService,
  ) {}

  async login(loginDto: LoginDto, ip?: string): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { Correo: loginDto.correo },
    });

    if (!user) {
      await this.auditoriaService.registrarSesion(TipoEventoSesion.LoginFallido, {
        correo: loginDto.correo,
        detalle: 'Correo no registrado',
        ip,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.EstaActivo) {
      await this.auditoriaService.registrarSesion(TipoEventoSesion.LoginFallido, {
        usuario: user,
        correo: loginDto.correo,
        detalle: 'Usuario inactivo',
        ip,
      });
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.contrasena,
      user.Contrasena,
    );

    if (!isPasswordValid) {
      await this.auditoriaService.registrarSesion(TipoEventoSesion.LoginFallido, {
        usuario: user,
        correo: loginDto.correo,
        detalle: 'Contraseña incorrecta',
        ip,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id);

    await this.auditoriaService.registrarSesion(TipoEventoSesion.Login, {
      usuario: user,
      correo: user.Correo,
      ip,
    });
    const modulosAccesibles =
      await this.seguridadService.obtenerModulosAccesibles(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        nombre: user.Nombre,
        apellido: user.Apellido,
        correo: user.Correo,
        telefono: user.Telefono,
        estaActivo: user.EstaActivo,
        modulosAccesibles,
      },
    };
  }

  // ======================================================
  // LOGOUT — invalida el refresh token y registra la auditoría.
  // Si no se envía refreshToken, cierra todas las sesiones del usuario.
  // (El access token sigue siendo válido hasta que vence, máx. 15 minutos.)
  // ======================================================
  async logout(
    userId: number,
    refreshToken?: string,
    ip?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (refreshToken) {
      await this.refreshTokenRepository.update(
        { token: refreshToken, userId, isActive: true },
        { isActive: false },
      );
    } else {
      await this.refreshTokenRepository.update(
        { userId, isActive: true },
        { isActive: false },
      );
    }

    await this.auditoriaService.registrarSesion(TipoEventoSesion.Logout, {
      usuario: user,
      correo: user?.Correo,
      ip,
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { Correo: registerDto.correo },
    });

    if (existingUser) {
      throw new BadRequestException('El correo ya está registrado');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.contrasena, 10);

    // Todo usuario que se registra desde la app es un cliente:
    // se le asigna el grupo "Cliente" (sus permisos se administran desde el módulo de seguridad).
    const grupoCliente = await this.grupoRepository.findOne({
      where: { nombre: 'Cliente' },
    });
    if (!grupoCliente) {
      console.warn(
        '[register] No existe el grupo "Cliente". El usuario se crea sin grupo. Ejecutá el script del paso 1.',
      );
    }

    // Create user
    const user = this.userRepository.create({
      Nombre: registerDto.nombre,
      Apellido: registerDto.apellido,
      Correo: registerDto.correo,
      Contrasena: hashedPassword,
      Telefono: registerDto.telefono,
      EstaActivo: true,
      grupos: grupoCliente ? [grupoCliente] : [],
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser.id);
    const modulosAccesibles =
      await this.seguridadService.obtenerModulosAccesibles(savedUser.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: savedUser.id,
        nombre: savedUser.Nombre,
        apellido: savedUser.Apellido,
        correo: savedUser.Correo,
        telefono: savedUser.Telefono,
        estaActivo: savedUser.EstaActivo,
        modulosAccesibles,
      },
    };
  }

  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.Contrasena,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    const hashedNewPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    user.Contrasena = hashedNewPassword;
    await this.userRepository.save(user);

    // Invalidate all refresh tokens for security
    await this.refreshTokenRepository.update(
      { userId, isActive: true },
      { isActive: false },
    );
  }

  async requestPasswordReset(
    resetPasswordRequestDto: ResetPasswordRequestDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { Correo: resetPasswordRequestDto.correo },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
      };
    }

    // Generate reset token (válido 1 hora)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.mailerService.sendMail({
      to: user.Correo,
      subject: 'Restablecer contraseña - BarApp',
      html: `
        <p>Hola ${user.Nombre},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el siguiente enlace (válido por 1 hora):</p>
        <p><a href="${resetLink}">Restablecer contraseña</a></p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        <p>— BarApp</p>
      `,
      text: `Restablecer contraseña: ${resetLink}`,
    });

    return {
      message: 'Si el correo existe, recibirás un enlace para restablecer tu contraseña.',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.verify<{
        sub: number;
        type: string;
      }>(resetPasswordDto.token);

      if (payload.type !== 'password-reset') {
        throw new UnauthorizedException('Token inválido');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const hashedPassword = await bcrypt.hash(
        resetPasswordDto.newPassword,
        10,
      );
      user.Contrasena = hashedPassword;
      await this.userRepository.save(user);

      // Invalidate all refresh tokens
      await this.refreshTokenRepository.update(
        { userId: user.id, isActive: true },
        { isActive: false },
      );

      return { message: 'Contraseña actualizada correctamente' };
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Token expirado');
      }
      throw new UnauthorizedException('Token inválido');
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenDto.refreshToken, isActive: true },
      relations: ['user'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Token de refresco inválido');
    }

    if (refreshToken.expiresAt < new Date()) {
      refreshToken.isActive = false;
      await this.refreshTokenRepository.save(refreshToken);
      throw new UnauthorizedException('Token de refresco expirado');
    }

    if (!refreshToken.user.EstaActivo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(refreshToken.user.id);

    // Deactivate old refresh token
    refreshToken.isActive = false;
    await this.refreshTokenRepository.save(refreshToken);

    const modulosAccesibles =
      await this.seguridadService.obtenerModulosAccesibles(
        refreshToken.user.id,
      );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: refreshToken.user.id,
        nombre: refreshToken.user.Nombre,
        apellido: refreshToken.user.Apellido,
        correo: refreshToken.user.Correo,
        telefono: refreshToken.user.Telefono,
        estaActivo: refreshToken.user.EstaActivo,
        modulosAccesibles,
      },
    };
  }

  private async generateTokens(userId: number): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: userId };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: refreshToken,
      userId,
      expiresAt,
      isActive: true,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}