import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditoriaService } from './auditoria.service';
import { CambioReservaDto, ReporteSesionesDto } from './auditoria.dto';
import { AccionesGuard } from '../guards/acciones.guard';
import { RequiereAcciones } from '../decorators/acciones.decorator';

@Controller('auditoria')
@UseGuards(AuthGuard('jwt'), AccionesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  // GET /auditoria/sesiones?desde=2026-10-01&hasta=2026-10-31&tipo=LOGIN&usuarioId=3
  @Get('sesiones')
  @RequiereAcciones('Auditoria.Ver Auditoria de Sesiones')
  sesiones(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('tipo') tipo?: string,
    @Query('usuarioId') usuarioId?: string,
  ): Promise<ReporteSesionesDto> {
    return this.auditoriaService.reporteSesiones({ desde, hasta, tipo, usuarioId });
  }

  // GET /auditoria/reservas?desde=&hasta=&usuarioId=&idReserva=
  @Get('reservas')
  @RequiereAcciones('Auditoria.Ver Auditoria de Reservas')
  reservas(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('usuarioId') usuarioId?: string,
    @Query('idReserva') idReserva?: string,
  ): Promise<CambioReservaDto[]> {
    return this.auditoriaService.reporteReservas({
      desde,
      hasta,
      usuarioId,
      idReserva,
    });
  }
}