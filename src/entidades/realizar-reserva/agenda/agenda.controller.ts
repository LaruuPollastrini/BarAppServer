import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgendaService } from './agenda.service';
import {
  AgendaConCupoDto,
  CrearAgendaDto,
  CrearRangoAgendaDto,
  ResultadoRangoDto,
} from './agenda.dto';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

/**
 * Todos los endpoints requieren usuario logueado (JWT) y la acción correspondiente.
 * Los permisos se asignan a los grupos desde el módulo de seguridad.
 */
@Controller('agenda')
@UseGuards(AuthGuard('jwt'), AccionesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  // ===========================
  // CLIENTE — Turnos disponibles para reservar
  // GET /agenda
  // ===========================
  @Get()
  @RequiereAcciones('Realizar Reserva.Ver Disponibilidad')
  listarDisponibles(): Promise<AgendaConCupoDto[]> {
    return this.agendaService.listarDisponibles();
  }

  // ===========================
  // GESTIÓN — Toda la agenda, con cupos
  // GET /agenda/admin?desde=2026-10-01&hasta=2026-10-31
  // ===========================
  @Get('admin')
  @RequiereAcciones('Gestionar Agenda.Ver Agenda')
  listarTodo(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<AgendaConCupoDto[]> {
    return this.agendaService.listarTodo(desde, hasta);
  }

  // ===========================
  // GESTIÓN — Publicar un turno
  // POST /agenda
  // ===========================
  @Post()
  @RequiereAcciones('Gestionar Agenda.Cargar Disponibilidad')
  publicar(@Body() dto: CrearAgendaDto): Promise<AgendaConCupoDto> {
    return this.agendaService.publicar(dto);
  }

  // ===========================
  // GESTIÓN — Publicar un rango de turnos
  // POST /agenda/rango
  // ===========================
  @Post('rango')
  @RequiereAcciones('Gestionar Agenda.Cargar Disponibilidad')
  publicarRango(@Body() dto: CrearRangoAgendaDto): Promise<ResultadoRangoDto> {
    return this.agendaService.publicarRango(dto);
  }

  // ===========================
  // GESTIÓN — Cambiar la capacidad de un turno
  // PATCH /agenda/:id/capacidad   body: { "capacidad": 40 }
  // ===========================
  @Patch(':id/capacidad')
  @RequiereAcciones('Gestionar Agenda.Cargar Disponibilidad')
  modificarCapacidad(
    @Param('id', ParseIntPipe) id: number,
    @Body('capacidad') capacidad: number,
  ): Promise<AgendaConCupoDto> {
    return this.agendaService.modificarCapacidad(id, capacidad);
  }

  // ===========================
  // GESTIÓN — Eliminar un turno (baja lógica)
  // DELETE /agenda/:id
  // ===========================
  @Delete(':id')
  @RequiereAcciones('Gestionar Agenda.Eliminar Disponibilidad')
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.agendaService.eliminar(id);
  }
}