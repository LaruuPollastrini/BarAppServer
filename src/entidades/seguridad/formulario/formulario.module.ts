import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Formulario } from './formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { Accion } from '../acciones/acciones.entity';
import { FormularioService } from './formulario.service';
import { FormularioController } from './formulario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Formulario, Modulo, Accion])],
  providers: [FormularioService],
  controllers: [FormularioController],
  exports: [FormularioService],
})
export class FormularioModule {}
