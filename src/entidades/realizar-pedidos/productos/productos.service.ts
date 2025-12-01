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
    return lista.filter(producto => !producto.estaEliminado);
  }

  findOne(id: number): Promise<Producto | null> {
    return this.productosRepository.findOneBy({ id: id });
  }

  async remove(id: number): Promise<void> {
    const producto = await this.productosRepository.findOneBy({ id: id });
    if (!producto) {
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    await this.productosRepository.update({id}, { estaEliminado: true });
  }

  async agregar(nombre: string, descripcion: string, precio: number): Promise<void> {
    try {
          if (!nombre) {
      throw new Error('Nombre del producto no encontrado');
          }
          if(precio <= 0) {
      throw new Error('El precio no puede ser menor o igual a cero');
          }
      const ProductoExistente = await this.productosRepository.findOneBy({nombre});
    if (ProductoExistente) {
      throw new Error(`Producto con nombre ${nombre} ya existe`);
    }
    const nuevoProducto = this.productosRepository.create({ nombre, descripcion, precio });
    await this.productosRepository.save(nuevoProducto);
  }
    catch (error) {
      throw new Error(`Error al agregar el producto: ${error.message}`);
    }
  }

  async modificar(producto: Producto): Promise<void> {
    try {
      const productoExistente = await this.productosRepository.findOneBy({ id: producto.id});
      if (!productoExistente) {
        throw new Error(`Producto con ID ${producto.id} no encontrado`);
      }
        if (!producto.nombre) {
      throw new Error('Nombre del producto no encontrado');
          }
          if(producto.precio <= 0) {
      throw new Error('El precio no puede ser menor o igual a cero');
          }
      await this.productosRepository.update({ id: producto.id }, producto);
    } catch (error) {
      throw new Error(`Error al modificar el producto: ${error.message}`);
    }
  }
}
