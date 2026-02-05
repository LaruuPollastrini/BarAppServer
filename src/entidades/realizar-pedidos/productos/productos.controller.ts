import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Producto } from './productos.entity';
import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductosService) {}
  @Post('/')
  async agregarProducto(
    @Body('nombre') nombre: string,
    @Body('descripcion') descripcion: string,
    @Body('precio') precio: number,
    @Body('categoria') categoria: string,
  ): Promise<string> {
    try {
      await this.productoService.agregar(
        nombre,
        descripcion,
        precio,
        categoria,
      );
      return `El producto ha sido agregado correctamente`;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al agregar el producto',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('/')
  async modificarPedido(@Body() producto: Producto): Promise<string> {
    try {
      await this.productoService.modificar(producto);
      return `Producto con ID ${producto.id} actualizado correctamente`;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al modificar el producto',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('/:id')
  async eliminarProducto(@Param('id') id: number): Promise<string> {
    try {
      await this.productoService.remove(id);
      return `Producto con ID ${id} eliminado correctamente`;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al eliminar el producto',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Get('/')
  async listarProductosDisponibles(): Promise<string> {
    const productos = await this.productoService.findAllAvailable();
    return JSON.stringify(productos);
  }

  @Get('/:id')
  async listarProductosID(@Param('id') id: number): Promise<string> {
    const productos = await this.productoService.findOne(id);
    return JSON.stringify(productos);
  }
}
