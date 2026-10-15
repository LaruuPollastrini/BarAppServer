import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './reserva.entity';
import { ReservaHistorial } from './reserva-historial.entity';
import { Agenda } from '../agenda/agenda.entity';
import { ReservaService } from './reserva.service';
import { ReservaController } from './reserva.controller';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reserva, ReservaHistorial, Agenda]),
    SeguridadModule,
  ],
  providers: [ReservaService],
  controllers: [ReservaController],
  exports: [ReservaService],
})
export class ReservaModule {}