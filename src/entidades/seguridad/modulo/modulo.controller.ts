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
import { ModuloService } from './modulo.service';
import { CreateModuloDto, UpdateModuloDto } from './modulo.dto';
import { Modulo } from './modulo.entity';

@Controller('modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Get()
  async findAll(): Promise<Modulo[]> {
    return this.moduloService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Modulo> {
    return this.moduloService.findOne(id);
  }

  @Post()
  async create(@Body() createModuloDto: CreateModuloDto): Promise<Modulo> {
    return this.moduloService.create(createModuloDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuloDto: UpdateModuloDto,
  ): Promise<Modulo> {
    return this.moduloService.update(id, updateModuloDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.moduloService.remove(id);
  }
}

