import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { SeguridadService } from './seguridad.service';
import { AccionesGuard } from './guards/acciones.guard';
import { JwtStrategy } from './jwt.strategy';
import { User } from './users/users.entity';
import { Grupo } from './grupos/grupos.entity';
import { ModuloModule } from './modulo/modulo.module';
import { FormularioModule } from './formulario/formulario.module';
import { AccionesModule } from './acciones/acciones.module';
import { GruposModule } from './grupos/grupos.module';
import { UsersModule } from './users/users.module';

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
    ModuloModule,
    FormularioModule,
    AccionesModule,
    GruposModule,
    UsersModule,
  ],
  providers: [SeguridadService, AccionesGuard, JwtStrategy],
  exports: [SeguridadService, AccionesGuard],
})
export class SeguridadModule {}
