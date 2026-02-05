import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { PedidoModule } from './entidades/realizar-pedidos/pedidos/pedido.module';
import { TicketModule } from './entidades/realizar-pedidos/ticket/ticket.module';
import { ProductoModule } from './entidades/realizar-pedidos/productos/productos.module';
import { MesaModule } from './entidades/realizar-pedidos/mesa/mesa.module';
import { SessionModule } from './entidades/realizar-pedidos/session/session.module';
import { CategoriaModule } from './entidades/realizar-pedidos/categoria/categoria.module';
import { SeguridadModule } from './entidades/seguridad/seguridad.module';
import { AuthModule } from './entidades/seguridad/auth/auth.module';
import { AccionesModule } from './entidades/seguridad/acciones/acciones.module';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: process.env.EMAIL_FROM || '"BarApp" <noreply@barapp.com>',
      },
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'bar_app',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      // synchronize: false evita que TypeORM intente DROP INDEX en FKs (error ER_DROP_INDEX_FK en MySQL).
      // Gestiona el esquema con seed.sql o migraciones.
      synchronize: false,
      logger: 'debug',
    }),
    SeguridadModule,
    AccionesModule,
    PedidoModule,
    TicketModule,
    ProductoModule,
    MesaModule,
    SessionModule,
    CategoriaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
