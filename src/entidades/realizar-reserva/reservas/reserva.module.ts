// reserva.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reserva } from './reserva.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Agenda } from '../agenda/agenda.entity';

import { ReservaService } from './reserva.service';
import { ReservaController } from './reserva.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, User, Agenda])],
  providers: [ReservaService],
  controllers: [ReservaController],
  exports: [ReservaService],
})
export class ReservaModule {}
