import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { AgendaService } from './agenda.service';

@Controller('agenda')
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  // ===========================
  // ADMIN — PUBLICAR FECHA + HORARIO
  // ===========================
  @Post()
  async publicar(
    @Body() body: { fecha: Date; horario: string },
  ) {
    return this.agendaService.publicar(body.fecha, body.horario);
  }

  // ===========================
  // ADMIN — LISTAR TODO
  // ===========================
  @Get('admin')
  async listarTodo() {
    return this.agendaService.listarTodo();
  }

  // ===========================
  // CLIENTE — LISTAR DISPONIBLES
  // ===========================
  @Get()
  async listarDisponibles() {
    return this.agendaService.listarDisponibles();
  }

  // ===========================
  // ADMIN — ELIMINAR DISPONIBILIDAD
  // ===========================
  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.agendaService.eliminar(id);
  }
}
