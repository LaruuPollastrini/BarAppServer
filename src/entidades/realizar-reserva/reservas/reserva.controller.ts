import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservaService } from './reserva.service';
import { CrearReservaDto, ReservaRespuestaDto } from './reserva.dto';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

// request.user lo carga JwtStrategy con el usuario completo (grupos, formularios y acciones)
type RequestConUsuario = { user: User };

@Controller('reservas')
@UseGuards(AuthGuard('jwt'), AccionesGuard)
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  // ===========================
  // CLIENTE — Crear reserva
  // POST /reservas   body: { "agendaId": 3, "cantidadPersonas": 4 }
  // ===========================
  @Post()
  @RequiereAcciones('Realizar Reserva.Crear Reserva')
  crear(
    @Req() req: RequestConUsuario,
    @Body() dto: CrearReservaDto,
  ): Promise<ReservaRespuestaDto> {
    return this.reservaService.crearReserva(req.user, dto);
  }

  // ===========================
  // CLIENTE — Mis reservas
  // GET /reservas/mias
  // ===========================
  @Get('mias')
  @RequiereAcciones('Realizar Reserva.Ver Mis Reservas')
  misReservas(@Req() req: RequestConUsuario): Promise<ReservaRespuestaDto[]> {
    return this.reservaService.misReservas(req.user);
  }

  // ===========================
  // RECEPCIÓN — Reservas aceptadas del día
  // GET /reservas/del-dia?fecha=2026-10-24   (sin fecha = hoy)
  // ===========================
  @Get('del-dia')
  @RequiereAcciones('Recibir Reservas.Ver Reservas del Dia')
  delDia(@Query('fecha') fecha?: string): Promise<ReservaRespuestaDto[]> {
    return this.reservaService.delDia(fecha);
  }

  // ===========================
  // GESTIÓN — Todas las reservas, con filtros opcionales
  // GET /reservas?estado=Pendiente&desde=2026-10-01&hasta=2026-10-31
  // ===========================
  @Get()
  @RequiereAcciones('Gestionar Reservas.Ver Reservas')
  listar(
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ): Promise<ReservaRespuestaDto[]> {
    return this.reservaService.listar(estado, desde, hasta);
  }

  // ===========================
  // DETALLE (con historial) — el dueño o el personal del bar
  // GET /reservas/:id
  // ===========================
  @Get(':id')
  detalle(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestConUsuario,
  ): Promise<ReservaRespuestaDto> {
    return this.reservaService.obtenerDetalle(id, req.user);
  }
}