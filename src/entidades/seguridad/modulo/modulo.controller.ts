import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ModuloService } from './modulo.service';
import { ModuloResponseDto } from './modulo.dto';

/**
 * Módulos son predefinidos (páginas del sistema). Solo lectura: listar y ver detalle.
 */
@Controller('modulos')
export class ModuloController {
  constructor(private readonly moduloService: ModuloService) {}

  @Get()
  async findAll(): Promise<ModuloResponseDto[]> {
    return this.moduloService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ModuloResponseDto> {
    return this.moduloService.findOne(id);
  }
}
