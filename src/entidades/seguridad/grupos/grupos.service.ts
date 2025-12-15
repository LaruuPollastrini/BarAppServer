import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grupo } from './grupos.entity';
import { Accion } from '../acciones/acciones.entity';
import { CreateGrupoDto, UpdateGrupoDto, GrupoResponseDto } from './grupos.dto';

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    @InjectRepository(Accion)
    private accionRepository: Repository<Accion>,
  ) {}

  private transformToResponseDto(grupo: Grupo): GrupoResponseDto {
    return {
      id: grupo.id,
      nombre: grupo.nombre,
      estado: grupo.Estado,
      acciones: grupo.acciones?.map((accion) => ({
        id: accion.id,
        nombre: accion.nombre,
        formulario: accion.formulario
          ? {
              id: accion.formulario.id,
              nombre: accion.formulario.nombre,
            }
          : undefined,
      })),
    };
  }

  async findAll(): Promise<GrupoResponseDto[]> {
    const grupos = await this.grupoRepository.find({
      relations: ['acciones', 'acciones.formulario'],
    });
    return grupos.map((grupo) => this.transformToResponseDto(grupo));
  }

  async findOne(id: number): Promise<GrupoResponseDto> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones', 'acciones.formulario'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    return this.transformToResponseDto(grupo);
  }

  async create(createGrupoDto: CreateGrupoDto): Promise<GrupoResponseDto> {
    const grupo = this.grupoRepository.create({
      nombre: createGrupoDto.nombre,
      Estado: createGrupoDto.estado !== undefined ? createGrupoDto.estado : true,
    });

    const savedGrupo = await this.grupoRepository.save(grupo);

    if (createGrupoDto.accionesIds && createGrupoDto.accionesIds.length > 0) {
      const acciones = await this.accionRepository.findBy({
        id: In(createGrupoDto.accionesIds),
      });
      savedGrupo.acciones = acciones;
      const updatedGrupo = await this.grupoRepository.save(savedGrupo);
      return this.findOne(updatedGrupo.id);
    }

    return this.findOne(savedGrupo.id);
  }

  async update(id: number, updateGrupoDto: UpdateGrupoDto): Promise<GrupoResponseDto> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    grupo.nombre = updateGrupoDto.nombre;
    if (updateGrupoDto.estado !== undefined) {
      grupo.Estado = updateGrupoDto.estado;
    }

    if (updateGrupoDto.accionesIds !== undefined) {
      const acciones = await this.accionRepository.findBy({
        id: In(updateGrupoDto.accionesIds),
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

