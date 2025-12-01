import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TicketsService } from "./ticket.service";


@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketService: TicketsService) {}
@Get("/")
  async obtenerTicketById(@Param("id") id: number): Promise<string> {
    return JSON.stringify(await this.ticketService.findOne(id));
  }
   @Post("/")
  async generarTicket(@Body("pedidoId") pedidoId: number): Promise<string> {
    await this.ticketService.generar(pedidoId);
    return `El ticket se genero correctamente`;
  }

}
