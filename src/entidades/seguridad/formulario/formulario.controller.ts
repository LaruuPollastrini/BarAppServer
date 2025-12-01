import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FormularioService } from './formulario.service';
import { CreateFormularioDto, UpdateFormularioDto } from './formulario.dto';
import { Formulario } from './formulario.entity';

@Controller('formularios')
export class FormularioController {
  constructor(private readonly formularioService: FormularioService) {}

  @Get()
  async findAll(): Promise<Formulario[]> {
    return this.formularioService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Formulario> {
    return this.formularioService.findOne(id);
  }

  @Post()
  async create(
    @Body() createFormularioDto: CreateFormularioDto,
  ): Promise<Formulario> {
    return this.formularioService.create(createFormularioDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFormularioDto: UpdateFormularioDto,
  ): Promise<Formulario> {
    return this.formularioService.update(id, updateFormularioDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.formularioService.remove(id);
  }
}

