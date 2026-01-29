import {
  Controller,
  Get,
} from '@nestjs/common';
import { AccionesService } from './acciones.service';
import { AccionResponseDto } from './acciones.dto';

@Controller('acciones')
export class AccionesController {
  constructor(private readonly accionesService: AccionesService) {}

  /**
   * Get all actions that exist in the database
   * This is used by the frontend to display available actions when assigning to groups
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
  async getPredefinedActionsWithGrupos(): Promise<Array<{
    key: string;
    label: string;
    formulario: string;
    accionNombre: string;
    grupos: Array<{ id: number; nombre: string }>;
    existsInDb: boolean;
    dbId?: number;
  }>> {
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
      formulario: string;
      modulo: string;
      key: string;
    }>;
  }> {
    return this.accionesService.verifyAccionesMatch();
  }
}

