import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './tickets.entity';
import { TicketsService } from './ticket.service';
import { TicketsController } from './ticket.controller';
import { Pedidos } from '../pedidos/pedidos.entity';
import { Mesa } from '../mesa/mesas.entity';
import { PedidoModule } from '../pedidos/pedido.module';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket, Pedidos, Mesa]),
    forwardRef(() => PedidoModule),
    SeguridadModule,
  ],
  providers: [TicketsService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketModule {}
