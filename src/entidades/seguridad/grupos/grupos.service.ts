import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grupo } from './grupos.entity';
import { Accion } from '../acciones/acciones.entity';
import { CreateGrupoDto, UpdateGrupoDto } from './grupos.dto';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    @InjectRepository(Accion)
    private accionRepository: Repository<Accion>,
  ) {}

  async findAll(): Promise<Grupo[]> {
    return this.grupoRepository.find({
      relations: ['acciones', 'acciones.formulario'],
    });
  }

  async findOne(id: number): Promise<Grupo> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones', 'acciones.formulario'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    return grupo;
  }

  async create(createGrupoDto: CreateGrupoDto): Promise<Grupo> {
    const grupo = this.grupoRepository.create({
      nombre: createGrupoDto.nombre,
      Estado: createGrupoDto.Estado !== undefined ? createGrupoDto.Estado : true,
    });

    const savedGrupo = await this.grupoRepository.save(grupo);

    if (createGrupoDto.acciones_ids && createGrupoDto.acciones_ids.length > 0) {
      const acciones = await this.accionRepository.findBy({
        id: In(createGrupoDto.acciones_ids),
      });
      savedGrupo.acciones = acciones;
      const updatedGrupo = await this.grupoRepository.save(savedGrupo);
      return this.findOne(updatedGrupo.id);
    }

    return this.findOne(savedGrupo.id);
  }

  async update(id: number, updateGrupoDto: UpdateGrupoDto): Promise<Grupo> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    grupo.nombre = updateGrupoDto.nombre;
    if (updateGrupoDto.Estado !== undefined) {
      grupo.Estado = updateGrupoDto.Estado;
    }

    if (updateGrupoDto.acciones_ids !== undefined) {
      const acciones = await this.accionRepository.findBy({
        id: In(updateGrupoDto.acciones_ids),
      });
      grupo.acciones = acciones;
    }

    await this.grupoRepository.save(grupo);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if grupo exists
    await this.grupoRepository.delete(id);
  }
}

