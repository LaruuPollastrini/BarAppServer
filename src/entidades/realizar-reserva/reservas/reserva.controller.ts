import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { ReservaService } from './reserva.service';

@Controller('reservas')
export class ReservaController {
  constructor(private readonly reservaService: ReservaService) {}

  @Post()
  async crearReserva(
    @Body()
    body: {
      clienteId: number;
      agendaId: number;
      cantidadPersonas: number;
    },
  ) {
    return this.reservaService.crearReserva(
      body.clienteId,
      body.agendaId,
      body.cantidadPersonas,
    );
  }

  @Get()
  async getAllReservas() {
    return this.reservaService.getAll();
  }

  @Get('cliente/:clienteId')
  async getReservasPorCliente(
    @Param('clienteId', ParseIntPipe) clienteId: number,
  ) {
    return this.reservaService.getByCliente(clienteId);
  }

  @Get(':id')
  async getReservaById(@Param('id', ParseIntPipe) id: number) {
    return this.reservaService.getById(id);
  }

  @Delete(':id')
  async eliminarReserva(@Param('id', ParseIntPipe) id: number) {
    return this.reservaService.eliminar(id);
  }
}
