import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedidos } from './pedidos.entity';
import { PedidoService } from './pedido.service';
import { PedidosController } from './pedido.controller';
import { Mesa } from '../mesa/mesas.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Producto } from '../productos/productos.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';
import { SessionModule } from '../session/session.module';
import { SeguridadModule } from '../../seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pedidos, Mesa, User, Producto, DetallesPedido]),
    SessionModule,
    SeguridadModule,
  ],
  providers: [PedidoService],
  // agregar controladora
  controllers: [PedidosController],
  exports: [PedidoService],
})
export class PedidoModule {}
