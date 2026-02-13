import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriaService {
  constructor(
    @InjectRepository(Categoria)
    private categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(): Promise<Categoria[]> {
    const categorias = await this.categoriaRepository.find({
      where: { estaEliminado: false },
      order: { nombre: 'ASC' },
    });
    return categorias;
  }

  async findOne(id: number): Promise<Categoria | null> {
    return this.categoriaRepository.findOneBy({ id, estaEliminado: false });
  }

  async findByNombre(nombre: string): Promise<Categoria | null> {
    return this.categoriaRepository.findOneBy({
      nombre,
      estaEliminado: false,
    });
  }

  async create(nombre: string, descripcion?: string): Promise<Categoria> {
    if (!nombre || nombre.trim() === '') {
      throw new BadRequestException('El nombre de la categoría es obligatorio');
    }

    const existing = await this.categoriaRepository.findOneBy({
      nombre: nombre.trim(),
    });
    if (existing) {
      if (existing.estaEliminado) {
        existing.estaEliminado = false;
        existing.descripcion = descripcion?.trim() || existing.descripcion;
        return this.categoriaRepository.save(existing);
      }
      throw new ConflictException(`La categoría "${nombre.trim()}" ya existe`);
    }

    const categoria = this.categoriaRepository.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
    });
    return this.categoriaRepository.save(categoria);
  }

  async update(
    id: number,
    nombre?: string,
    descripcion?: string,
  ): Promise<Categoria> {
    const categoria = await this.categoriaRepository.findOneBy({ id });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    const newNombre =
      nombre !== undefined && nombre !== null ? nombre.trim() : null;
    if (newNombre !== null) {
      if (newNombre === '') {
        throw new BadRequestException(
          'El nombre de la categoría es obligatorio',
        );
      }
      const existing = await this.categoriaRepository.findOne({
        where: {
          nombre: newNombre,
          id: Not(id),
          estaEliminado: false,
        },
      });
      if (existing) {
        throw new ConflictException(
          `La categoría "${newNombre}" ya existe`,
        );
      }
      categoria.nombre = newNombre;
    }

    if (descripcion !== undefined) {
      categoria.descripcion = descripcion?.trim() || null;
    }

    return this.categoriaRepository.save(categoria);
  }

  async remove(id: number): Promise<void> {
    const categoria = await this.categoriaRepository.findOneBy({ id });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }
    categoria.estaEliminado = true;
    await this.categoriaRepository.save(categoria);
  }
}
