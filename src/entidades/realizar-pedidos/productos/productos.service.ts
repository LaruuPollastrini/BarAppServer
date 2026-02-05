import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './productos.entity';
import { Categoria } from '../categoria/categoria.entity';

export interface ProductoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoriaId: number | null;
  categoriaName: string;
  estaEliminado: boolean;
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productosRepository: Repository<Producto>,
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
  ) {}

  private toResponse(p: Producto): ProductoResponse {
    return {
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      categoriaId: p.categoria?.id ?? null,
      categoriaName: p.categoria?.nombre ?? '',
      estaEliminado: p.estaEliminado,
    };
  }

  async findAllAvailable(): Promise<ProductoResponse[]> {
    const lista = await this.productosRepository.find({
      relations: ['categoria'],
    });
    return lista
      .filter((p) => !p.estaEliminado)
      .map((p) => this.toResponse(p));
  }

  async findOne(id: number): Promise<ProductoResponse | null> {
    const p = await this.productosRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });
    return p ? this.toResponse(p) : null;
  }

  async remove(id: number): Promise<void> {
    const producto = await this.productosRepository.findOneBy({ id });
    if (!producto) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    await this.productosRepository.update({ id }, { estaEliminado: true });
  }

  async agregar(
    nombre: string,
    descripcion: string,
    precio: number,
    categoriaId?: number | null,
  ): Promise<void> {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (precio <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    let categoria: Categoria | null = null;
    if (categoriaId) {
      categoria = await this.categoriaRepository.findOneBy({
        id: categoriaId,
        estaEliminado: false,
      });
      if (!categoria) {
        throw new Error('Categoría no encontrada o eliminada');
      }
    }

    const productoExistente = await this.productosRepository.findOne({
      where: { nombre: nombre.trim() },
      relations: ['categoria'],
    });

    if (productoExistente) {
      if (productoExistente.estaEliminado) {
        productoExistente.estaEliminado = false;
        productoExistente.descripcion = descripcion;
        productoExistente.precio = precio;
        productoExistente.categoria = categoria;
        await this.productosRepository.save(productoExistente);
        return;
      }
      throw new Error(
        `Ya existe un producto con el nombre "${nombre}". Por favor, usa un nombre diferente.`,
      );
    }

    const nuevoProducto = this.productosRepository.create({
      nombre: nombre.trim(),
      descripcion,
      precio,
      categoria,
    });
    await this.productosRepository.save(nuevoProducto);
  }

  async modificar(
    id: number,
    nombre: string,
    descripcion: string,
    precio: number,
    categoriaId?: number | null,
  ): Promise<void> {
    const productoExistente = await this.productosRepository.findOne({
      where: { id },
      relations: ['categoria'],
    });
    if (!productoExistente) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (precio <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    let categoria: Categoria | null = null;
    if (categoriaId) {
      categoria = await this.categoriaRepository.findOneBy({
        id: categoriaId,
        estaEliminado: false,
      });
      if (!categoria) {
        throw new Error('Categoría no encontrada o eliminada');
      }
    }

    const duplicado = await this.productosRepository.findOneBy({
      nombre: nombre.trim(),
    });
    if (duplicado && duplicado.id !== id && !duplicado.estaEliminado) {
      throw new Error(
        `Ya existe otro producto con el nombre "${nombre}". Por favor, usa un nombre diferente.`,
      );
    }

    productoExistente.nombre = nombre.trim();
    productoExistente.descripcion = descripcion;
    productoExistente.precio = precio;
    productoExistente.categoria = categoria;
    await this.productosRepository.save(productoExistente);
  }
}
