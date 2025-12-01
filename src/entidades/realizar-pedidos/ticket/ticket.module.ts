
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './tickets.entity';
import { TicketsService } from './ticket.service';
import { TicketsController } from './ticket.controller';
import { Pedidos } from '../pedidos/pedidos.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Pedidos])],
  providers: [TicketsService],
  controllers: [TicketsController],
})
export class TicketModule {}