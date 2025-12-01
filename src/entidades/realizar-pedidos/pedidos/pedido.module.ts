import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedidos } from './pedidos.entity';
import { PedidoService } from './pedido.service';
import { PedidosController } from './pedido.controller';
import { Mesa } from '../mesa/mesas.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Producto } from '../productos/productos.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';

@Module({
  // agregar las entidades que se necesiten si se usan como repository en el archivo de service.
  imports: [TypeOrmModule.forFeature([Pedidos, Mesa, User, Producto, DetallesPedido])],
  providers: [PedidoService],
  // agregar controladora
  controllers: [PedidosController],
})
export class PedidoModule {}