import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entidades/seguridad/users/users.entity';
import { Accion } from './entidades/seguridad/acciones/acciones.entity';
import { Formulario } from './entidades/seguridad/formulario/formulario.entity';
import { Grupo } from './entidades/seguridad/grupos/grupos.entity';
import { Modulo } from './entidades/seguridad/modulo/modulo.entity';
import { Mesa } from './entidades/realizar-pedidos/mesa/mesas.entity';
import { DetallesPedido } from './entidades/realizar-pedidos/detallePedido/detallespedido.entity';
import { Pedidos } from './entidades/realizar-pedidos/pedidos/pedidos.entity';
import { Producto } from './entidades/realizar-pedidos/productos/productos.entity';
import { Ticket } from './entidades/realizar-pedidos/ticket/tickets.entity';
import { PedidoModule } from './entidades/realizar-pedidos/pedidos/pedido.module';
import { TicketModule } from './entidades/realizar-pedidos/ticket/ticket.module';
import { ProductoModule } from './entidades/realizar-pedidos/productos/productos.module';
import { MesaModule } from './entidades/realizar-pedidos/mesa/mesa.module';
import { SeguridadModule } from './entidades/seguridad/seguridad.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'bar_app',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logger: "debug"
    }),
    SeguridadModule,
    PedidoModule,
    TicketModule,
    ProductoModule,
    MesaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
