import {
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EstadoService } from './estado.service';
import { ReservaRespuestaDto } from '../reservas/reserva.dto';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

type RequestConUsuario = { user: User };

/**
 * Cambios de estado de una reserva. Todos devuelven el detalle actualizado (con historial).
 */
@Controller('reservas')
@UseGuards(AuthGuard('jwt'), AccionesGuard)
export class EstadoController {
  constructor(private readonly estadoService: EstadoService) {}

  // PATCH /reservas/:id/aceptar
  @Patch(':id/aceptar')
  @RequiereAcciones('Gestionar Reservas.Aceptar Reserva')
  aceptar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
  ): Promise<ReservaRespuestaDto> {
    return this.estadoService.aceptar(id, req.user);
  }

  // PATCH /reservas/:id/rechazar
  @Patch(':id/rechazar')
  @RequiereAcciones('Gestionar Reservas.Rechazar Reserva')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
  ): Promise<ReservaRespuestaDto> {
    return this.estadoService.rechazar(id, req.user);
  }

  // PATCH /reservas/:id/cerrar
  @Patch(':id/cerrar')
  @RequiereAcciones('Recibir Reservas.Cerrar Reserva')
  cerrar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
  ): Promise<ReservaRespuestaDto> {
    return this.estadoService.cerrar(id, req.user);
  }

  // PATCH /reservas/:id/cancelar  (solo el dueño de la reserva)
  @Patch(':id/cancelar')
  @RequiereAcciones('Realizar Reserva.Cancelar Mi Reserva')
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
  ): Promise<ReservaRespuestaDto> {
    return this.estadoService.cancelarMia(id, req.user);
  }
}