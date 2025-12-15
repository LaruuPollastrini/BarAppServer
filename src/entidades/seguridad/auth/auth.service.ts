import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.entity';
import { RefreshToken } from './refresh-token.entity';
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
    private jwtService: JwtService,
    private seguridadService: SeguridadService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findOne({
      where: { Correo: loginDto.correo },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.EstaActivo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.contrasena,
      user.Contrasena,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id);
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

    // Create user
    const user = this.userRepository.create({
      Nombre: registerDto.nombre,
      Apellido: registerDto.apellido,
      Correo: registerDto.correo,
      Contrasena: hashedPassword,
      Telefono: registerDto.telefono,
      EstaActivo: true,
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
        message: 'Si el correo existe, se enviará un enlace de recuperación',
      };
    }

    // Generate reset token (in production, send via email)
    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // In production, send email with reset link
    // For now, we'll just return a message
    // In a real app, you'd store this token and send it via email
    console.log(`Password reset token for ${user.Correo}: ${resetToken}`);

    return {
      message: 'Si el correo existe, se enviará un enlace de recuperación',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
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
