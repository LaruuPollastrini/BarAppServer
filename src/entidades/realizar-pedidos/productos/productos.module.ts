import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './productos.entity';
import { Categoria } from '../categoria/categoria.entity';
import { ProductosService } from './productos.service';
import { ProductoController } from './productos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Categoria])],
  providers: [ProductosService],
  controllers: [ProductoController],
})
export class ProductoModule {}
