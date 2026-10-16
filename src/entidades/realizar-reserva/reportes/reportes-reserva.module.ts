import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agenda } from '../agenda/agenda.entity';
import { Reserva } from '../reservas/reserva.entity';
import { ReportesReservaService } from './reportes-reserva.service';
import { ReportesReservaController } from './reportes-reserva.controller';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agenda, Reserva]), SeguridadModule],
  providers: [ReportesReservaService],
  controllers: [ReportesReservaController],
})
export class ReportesReservaModule {}