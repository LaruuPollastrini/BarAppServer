import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/users.entity';
import { RefreshToken } from './refresh-token.entity';
import { Grupo } from '../grupos/grupos.entity';
import { SeguridadModule } from '../seguridad.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken, Grupo]),
    JwtModule.register({
      secret: 'tu-secreto-jwt',
      signOptions: { expiresIn: '15m' },
    }),
    SeguridadModule,
    AuditoriaModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}