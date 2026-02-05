import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from './modulo.entity';
import { Formulario } from '../formulario/formulario.entity';
import { ModuloService } from './modulo.service';
import { ModuloController } from './modulo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo, Formulario])],
  providers: [ModuloService],
  controllers: [ModuloController],
  exports: [ModuloService],
})
export class ModuloModule {}
