import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadoService } from './estado.service';
import { EstadoController } from './estado.controller';
import { Reserva } from '../reservas/reserva.entity';
import { ReservaHistorial } from '../reservas/reserva-historial.entity';
import { ReservaModule } from '../reservas/reserva.module';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, ReservaHistorial]),
    ReservaModule,
    SeguridadModule,
  ],
  providers: [EstadoService],
  controllers: [EstadoController],
  exports: [EstadoService],
})
export class EstadoModule {}