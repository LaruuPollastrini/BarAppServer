import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SeguridadService } from './seguridad.service';
import { AccionesGuard } from './guards/acciones.guard';
import { JwtStrategy } from './jwt.strategy';
import { User } from './users/users.entity';
import { Grupo } from './grupos/grupos.entity';

@Module({
  imports: [
      TypeOrmModule.forFeature([User, Grupo]),
    PassportModule,
    JwtModule.register({
      // agregar key
      secret: 'tu-secreto-jwt',
      signOptions: { expiresIn: '24h' },
      global: true,
    }),
  ],
  providers: [SeguridadService, AccionesGuard, JwtStrategy],
  exports: [SeguridadService, AccionesGuard],
})
export class SeguridadModule {}
