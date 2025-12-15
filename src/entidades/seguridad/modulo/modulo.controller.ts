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
import { CreateModuloDto, UpdateModuloDto, ModuloResponseDto } from './modulo.dto';

@Controller('modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Get()
  async findAll(): Promise<ModuloResponseDto[]> {
    return this.moduloService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ModuloResponseDto> {
    return this.moduloService.findOne(id);
  }

  @Post()
  async create(@Body() createModuloDto: CreateModuloDto): Promise<ModuloResponseDto> {
    return this.moduloService.create(createModuloDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModuloDto: UpdateModuloDto,
  ): Promise<ModuloResponseDto> {
    return this.moduloService.update(id, updateModuloDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.moduloService.remove(id);
  }
}

