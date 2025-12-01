import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formulario } from './formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { FormularioService } from './formulario.service';
import { FormularioController } from './formulario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Formulario, Modulo])],
  providers: [FormularioService],
  controllers: [FormularioController],
  exports: [FormularioService],
})
export class FormularioModule {}

