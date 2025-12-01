import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Accion } from './acciones.entity';
import { Formulario } from '../formulario/formulario.entity';
import { Grupo } from '../grupos/grupos.entity';
import { AccionesService } from './acciones.service';
import { AccionesController } from './acciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Accion, Formulario, Grupo])],
  providers: [AccionesService],
  controllers: [AccionesController],
  exports: [AccionesService],
})
export class AccionesModule {}

