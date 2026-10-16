import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaSesion } from './auditoria-sesion.entity';
import { ReservaHistorial } from '../../realizar-reserva/reservas/reserva-historial.entity';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { SeguridadModule } from '../seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditoriaSesion, ReservaHistorial]),
    SeguridadModule,
  ],
  providers: [AuditoriaService],
  controllers: [AuditoriaController],
  exports: [AuditoriaService], // lo usa AuthModule para registrar login/logout
})
export class AuditoriaModule {}