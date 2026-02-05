import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ProductosService } from './productos.service';

@Controller('productos')
export class ProductoController {
  constructor(private readonly productoService: ProductosService) {}

  @Post('/')
  async agregarProducto(
    @Body('nombre') nombre: string,
    @Body('descripcion') descripcion: string,
    @Body('precio') precio: number,
    @Body('categoriaId') categoriaId?: number | null,
  ): Promise<string> {
    try {
      await this.productoService.agregar(
        nombre,
        descripcion,
        precio,
        categoriaId,
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
  async modificarProducto(
    @Body('id') id: number,
    @Body('nombre') nombre: string,
    @Body('descripcion') descripcion: string,
    @Body('precio') precio: number,
    @Body('categoriaId') categoriaId?: number | null,
  ): Promise<string> {
    try {
      await this.productoService.modificar(
        id,
        nombre,
        descripcion,
        precio,
        categoriaId,
      );
      return `Producto con ID ${id} actualizado correctamente`;
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al modificar el producto',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('/:id')
  async eliminarProducto(@Param('id', ParseIntPipe) id: number): Promise<string> {
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
  async listarProductosDisponibles() {
    return this.productoService.findAllAvailable();
  }

  @Get('/:id')
  async listarProductosID(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.productoService.findOne(id);
    if (!producto) {
      throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
    }
    return producto;
  }
}
