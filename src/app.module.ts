import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
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
      password: 'password',
      database: 'bar_app',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logger: 'debug',
    }),
    SeguridadModule,
    PedidoModule,
    TicketModule,
    ProductoModule,
    MesaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
