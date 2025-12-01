import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Agenda } from './agenda.entity';


import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { Reserva } from '../reservas/reserva.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agenda, Reserva])],
  providers: [AgendaService],
  controllers: [AgendaController],
  exports: [AgendaService],
})
export class AgendaModule {}
