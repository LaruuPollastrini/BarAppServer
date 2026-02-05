import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './ticket.service';
import { Ticket } from './tickets.entity';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketsController {
  constructor(private readonly ticketService: TicketsService) {}

  @Get('by-mesa/:mesaId')
  @UseGuards(AccionesGuard)
  @RequiereAcciones('Mesas.Ver Historial de Pedidos')
  async getLastByMesa(@Param('mesaId') mesaId: string): Promise<Ticket[]> {
    return this.ticketService.findLastByMesa(Number(mesaId), 5);
  }

  @Get(':id')
  @UseGuards(AccionesGuard)
  @RequiereAcciones('Mesas.Ver Historial de Pedidos')
  async obtenerTicketById(@Param('id') id: string): Promise<Ticket> {
    const ticket = await this.ticketService.findOne(Number(id));
    if (!ticket) throw new Error('Ticket no encontrado');
    return ticket;
  }

  @Post('/')
  @UseGuards(AccionesGuard)
  @RequiereAcciones('Mesas.Imprimir Ticket')
  async generarTicket(
    @Body('pedidoId') pedidoId: number,
  ): Promise<{ message: string }> {
    await this.ticketService.generar(pedidoId);
    return { message: 'El ticket se generó correctamente' };
  }
}
