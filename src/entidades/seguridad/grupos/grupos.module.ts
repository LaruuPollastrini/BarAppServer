import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grupo } from './grupos.entity';
import { Accion } from '../acciones/acciones.entity';
import { GruposService } from './grupos.service';
import { GruposController } from './grupos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Grupo, Accion])],
  providers: [GruposService],
  controllers: [GruposController],
  exports: [GruposService],
})
export class GruposModule {}

