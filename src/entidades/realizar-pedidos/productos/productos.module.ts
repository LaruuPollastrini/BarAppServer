import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './productos.entity';
import { ProductosService } from './productos.service';
import { ProductoController } from './productos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Producto])],
  providers: [ProductosService],
  controllers: [ProductoController],
})
export class ProductoModule {}
