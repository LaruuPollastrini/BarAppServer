import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccionesService } from './acciones.service';
import { AccionResponseDto, UpdateAccionDto } from './acciones.dto';

@Controller('acciones')
@UseGuards(AuthGuard('jwt'))
export class AccionesController {
  constructor(private readonly accionesService: AccionesService) {}

  /**
   * Get all actions that exist in the database
   */
  @Get()
  async findAll(): Promise<AccionResponseDto[]> {
    return this.accionesService.findAll();
  }

  @Get('predefinidas/listado')
  async getPredefinedActions(): Promise<Array<{ key: string; label: string }>> {
    return this.accionesService.getPredefinedActions();
  }

  @Get('predefinidas/con-grupos')
  async getPredefinedActionsWithGrupos(): Promise<
    Array<{
      key: string;
      label: string;
      formulario: string;
      accionNombre: string;
      grupos: Array<{ id: number; nombre: string }>;
      existsInDb: boolean;
      dbId?: number;
    }>
  > {
    return this.accionesService.getPredefinedActionsWithGrupos();
  }

  @Get('fix-formularios-modulos')
  async fixFormulariosModulos(): Promise<{
    fixed: number;
    errors: Array<{ formulario: string; error: string }>;
  }> {
    return this.accionesService.fixFormulariosModulos();
  }

  @Get('verify-match')
  async verifyAccionesMatch(): Promise<{
    totalInDb: number;
    acciones: Array<{
      id: number;
      nombre: string;
      formularios: string[];
      key: string;
    }>;
  }> {
    return this.accionesService.verifyAccionesMatch();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AccionResponseDto> {
    return this.accionesService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccionDto: UpdateAccionDto,
  ): Promise<AccionResponseDto> {
    return this.accionesService.update(id, updateAccionDto);
  }
}
