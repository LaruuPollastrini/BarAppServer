import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';


import { EstadoService } from './estado.service';
import { EstadoController } from './estado.controller';
import { Reserva } from '../reservas/reserva.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva])],
  providers: [EstadoService],
  controllers: [EstadoController],
  exports: [EstadoService],
})
export class EstadoModule {}
