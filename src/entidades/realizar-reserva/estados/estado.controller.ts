import {
  Controller,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { EstadoService } from './estado.service';

@Controller('estado')
export class EstadoController {
  constructor(private readonly estadoService: EstadoService) {}

  // ==========================
  // ACEPTAR RESERVA
  // ==========================
  @Put(':id/aceptar')
  async aceptar(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.aceptar(id);
  }

  // ==========================
  // RECHAZAR RESERVA
  // ==========================
  @Put(':id/rechazar')
  async rechazar(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.rechazar(id);
  }

  // ==========================
  // CANCELAR RESERVA
  // ==========================
  @Put(':id/cancelar')
  async cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.cancelar(id);
  }

  // ==========================
  // CERRAR RESERVA
  // ==========================
  @Put(':id/cerrar')
  async cerrar(@Param('id', ParseIntPipe) id: number) {
    return this.estadoService.cerrar(id);
  }
}
