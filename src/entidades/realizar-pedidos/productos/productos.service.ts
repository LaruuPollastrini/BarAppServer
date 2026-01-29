import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './productos.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private productosRepository: Repository<Producto>,
  ) {}

  async findAllAvailable(): Promise<Producto[]> {
    const lista = await this.productosRepository.find();
    return lista.filter((producto) => !producto.estaEliminado);
  }

  findOne(id: number): Promise<Producto | null> {
    return this.productosRepository.findOneBy({ id: id });
  }

  async remove(id: number): Promise<void> {
    const producto = await this.productosRepository.findOneBy({ id: id });
    if (!producto) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    await this.productosRepository.update({ id }, { estaEliminado: true });
  }

  async agregar(
    nombre: string,
    descripcion: string,
    precio: number,
    categoria: string,
  ): Promise<void> {
    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (precio <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }
    if (!categoria || categoria.trim() === '') {
      throw new Error('La categoría del producto es obligatoria');
    }

    // Check if product with same name already exists (including deleted ones that could be reactivated)
    const productoExistente = await this.productosRepository.findOneBy({
      nombre: nombre.trim(),
    });

    if (productoExistente) {
      if (productoExistente.estaEliminado) {
        // Reactivate deleted product with new data
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

  async modificar(producto: Producto): Promise<void> {
    const productoExistente = await this.productosRepository.findOneBy({
      id: producto.id,
    });
    if (!productoExistente) {
      throw new Error(`Producto con ID ${producto.id} no encontrado`);
    }
    if (!producto.nombre || producto.nombre.trim() === '') {
      throw new Error('El nombre del producto es obligatorio');
    }
    if (producto.precio <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    // Check if another product with the same name exists
    const duplicado = await this.productosRepository.findOneBy({
      nombre: producto.nombre.trim(),
    });
    if (duplicado && duplicado.id !== producto.id && !duplicado.estaEliminado) {
      throw new Error(
        `Ya existe otro producto con el nombre "${producto.nombre}". Por favor, usa un nombre diferente.`,
      );
    }

    await this.productosRepository.update({ id: producto.id }, producto);
  }
}
