import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Modulo } from './modulo.entity';
import { Formulario } from '../formulario/formulario.entity';
import {
  CreateModuloDto,
  UpdateModuloDto,
  ModuloResponseDto,
} from './modulo.dto';

@Injectable()
export class ModuloService {
  constructor(
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
  ) {}

  private transformToResponseDto(modulo: Modulo): ModuloResponseDto {
    return {
      id: modulo.id,
      nombre: modulo.nombre,
      formularios: modulo.formularios?.map((formulario) => ({
        id: formulario.id,
        nombre: formulario.nombre,
      })),
    };
  }

  async findAll(): Promise<ModuloResponseDto[]> {
    const modulos = await this.moduloRepository.find({
      relations: ['formularios'],
    });
    return modulos.map((modulo) => this.transformToResponseDto(modulo));
  }

  async findOne(id: number): Promise<ModuloResponseDto> {
    const modulo = await this.moduloRepository.findOne({
      where: { id },
      relations: ['formularios'],
    });

    if (!modulo) {
      throw new NotFoundException(`Modulo with ID ${id} not found`);
    }

    return this.transformToResponseDto(modulo);
  }

  async create(createModuloDto: CreateModuloDto): Promise<ModuloResponseDto> {
    const modulo = this.moduloRepository.create({
      nombre: createModuloDto.nombre,
    });
    const savedModulo = await this.moduloRepository.save(modulo);

    if (
      createModuloDto.formularioIds &&
      createModuloDto.formularioIds.length > 0
    ) {
      await this.assignFormulariosToModulo(
        savedModulo.id,
        createModuloDto.formularioIds,
      );
    }

    return this.findOne(savedModulo.id);
  }

  async update(
    id: number,
    updateModuloDto: UpdateModuloDto,
  ): Promise<ModuloResponseDto> {
    const modulo = await this.moduloRepository.findOne({ where: { id } });
    if (!modulo) {
      throw new NotFoundException(`Modulo with ID ${id} not found`);
    }

    modulo.nombre = updateModuloDto.nombre;
    await this.moduloRepository.save(modulo);

    if (updateModuloDto.formularioIds !== undefined) {
      await this.assignFormulariosToModulo(id, updateModuloDto.formularioIds);
    }

    return this.findOne(id);
  }

  /**
   * Asigna los formularios indicados al módulo (actualiza modulo_id en cada formulario).
   * Si formularioIds está vacío, no se desasignan otros; solo se asignan los de la lista.
   */
  private async assignFormulariosToModulo(
    moduloId: number,
    formularioIds: number[],
  ): Promise<void> {
    if (formularioIds.length === 0) return;

    const modulo = await this.moduloRepository.findOne({
      where: { id: moduloId },
    });
    if (!modulo) return;

    const formularios = await this.formularioRepository.find({
      where: { id: In(formularioIds) },
    });

    for (const formulario of formularios) {
      formulario.modulo = modulo;
    }
    await this.formularioRepository.save(formularios);
  }

  async remove(id: number): Promise<void> {
    const modulo = await this.findOne(id);
    await this.moduloRepository.delete(id);
  }
}
