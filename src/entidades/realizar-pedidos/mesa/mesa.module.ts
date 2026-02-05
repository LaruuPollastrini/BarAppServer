import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mesa } from './mesas.entity';
import { MesaService } from './mesa.service';
import { MesaController } from './mesa.controller';
import { Pedidos } from '../pedidos/pedidos.entity';
import { PedidoModule } from '../pedidos/pedido.module';
import { TicketModule } from '../ticket/ticket.module';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mesa, Pedidos]),
    forwardRef(() => PedidoModule),
    forwardRef(() => TicketModule),
    SeguridadModule,
  ],
  providers: [MesaService],
  controllers: [MesaController],
})
export class MesaModule {}
