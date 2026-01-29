import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TicketsService } from './ticket.service';
import { Ticket } from './tickets.entity';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketService: TicketsService) {}

  @Get('by-mesa/:mesaId')
  async getLastByMesa(@Param('mesaId') mesaId: string): Promise<Ticket[]> {
    return this.ticketService.findLastByMesa(Number(mesaId), 5);
  }

  @Get(':id')
  async obtenerTicketById(@Param('id') id: string): Promise<Ticket> {
    const ticket = await this.ticketService.findOne(Number(id));
    if (!ticket) throw new Error('Ticket no encontrado');
    return ticket;
  }

  @Post('/')
  async generarTicket(
    @Body('pedidoId') pedidoId: number,
  ): Promise<{ message: string }> {
    await this.ticketService.generar(pedidoId);
    return { message: 'El ticket se generó correctamente' };
  }
}
