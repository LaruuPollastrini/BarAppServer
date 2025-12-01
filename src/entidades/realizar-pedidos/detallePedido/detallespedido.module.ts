import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { UsersController } from './user.controller';
import { DetallesPedido } from './detallespedido.entity';
import { DetallesPedidoService } from './detallepedido.service';

@Module({
  imports: [TypeOrmModule.forFeature([DetallesPedido])],
  providers: [DetallesPedido],
  // controllers: [UsersController],
})
export class detallepedido {}