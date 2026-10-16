import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportesReservaService } from './reportes-reserva.service';
import { ReporteEstadosDto, ReporteOcupacionDto } from './reportes-reserva.dto';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

/**
 * Reportes del core de reservas. Sin desde/hasta se usa el mes actual.
 */
@Controller('reservas/reportes')
@UseGuards(AuthGuard('jwt'), AccionesGuard)
export class ReportesReservaController {
  constructor(private readonly reportesService: ReportesReservaService) {}

  // GET /reservas/reportes/ocupacion?desde=2026-10-01&hasta=2026-10-31
  @Get('ocupacion')
  @RequiereAcciones('Reportes.Ver Reporte de Ocupacion')
  ocupacion(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<ReporteOcupacionDto> {
    return this.reportesService.ocupacion(desde, hasta);
  }

  // GET /reservas/reportes/estados?desde=2026-10-01&hasta=2026-10-31
  @Get('estados')
  @RequiereAcciones('Reportes.Ver Reporte de Estados de Reservas')
  estados(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<ReporteEstadosDto> {
    return this.reportesService.estados(desde, hasta);
  }
}