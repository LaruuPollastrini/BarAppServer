import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { Categoria } from './categoria.entity';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Get('/')
  async listarCategorias(): Promise<Categoria[]> {
    return this.categoriaService.findAll();
  }

  @Get('/:id')
  async obtenerCategoria(@Param('id') id: number): Promise<Categoria | null> {
    return this.categoriaService.findOne(id);
  }

  @Post('/')
  async crearCategoria(
    @Body('nombre') nombre: string,
    @Body('descripcion') descripcion?: string,
  ): Promise<Categoria> {
    return this.categoriaService.create(nombre, descripcion);
  }

  @Put('/:id')
  async actualizarCategoria(
    @Param('id') id: number,
    @Body('nombre') nombre: string,
    @Body('descripcion') descripcion?: string,
  ): Promise<Categoria> {
    return this.categoriaService.update(id, nombre, descripcion);
  }

  @Delete('/:id')
  async eliminarCategoria(@Param('id') id: number): Promise<string> {
    await this.categoriaService.remove(id);
    return `Categoría con ID ${id} eliminada correctamente`;
  }
}
