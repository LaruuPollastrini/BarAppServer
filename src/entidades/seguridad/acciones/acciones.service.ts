import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accion } from './acciones.entity';
import { Formulario } from '../formulario/formulario.entity';
import { Grupo } from '../grupos/grupos.entity';
import { CreateAccionDto, UpdateAccionDto, AccionResponseDto } from './acciones.dto';

@Injectable()
export class AccionesService {
  constructor(
    @InjectRepository(Accion)
    private accionRepository: Repository<Accion>,
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
  ) {}

  private transformToResponseDto(accion: Accion): AccionResponseDto {
    return {
      id: accion.id,
      nombre: accion.nombre,
      formulario: accion.formulario
        ? {
            id: accion.formulario.id,
            nombre: accion.formulario.nombre,
          }
        : undefined,
    };
  }

  async findAll(): Promise<AccionResponseDto[]> {
    const acciones = await this.accionRepository.find({
      relations: ['formulario', 'grupos'],
    });
    return acciones.map((accion) => this.transformToResponseDto(accion));
  }

  async findOne(id: number): Promise<AccionResponseDto> {
    const accion = await this.accionRepository.findOne({
      where: { id },
      relations: ['formulario', 'grupos'],
    });

    if (!accion) {
      throw new NotFoundException(`Accion with ID ${id} not found`);
    }

    return this.transformToResponseDto(accion);
  }

  async create(createAccionDto: CreateAccionDto): Promise<AccionResponseDto> {
    const formulario = await this.formularioRepository.findOne({
      where: { id: createAccionDto.formularioId },
    });

    if (!formulario) {
      throw new NotFoundException(
        `Formulario with ID ${createAccionDto.formularioId} not found`,
      );
    }

    const accion = this.accionRepository.create({
      nombre: createAccionDto.nombre,
      formulario: formulario,
    });

    return this.accionRepository.save(accion);
  }

  async update(id: number, updateAccionDto: UpdateAccionDto): Promise<AccionResponseDto> {
    await this.findOne(id); // Check if accion exists

    const formulario = await this.formularioRepository.findOne({
      where: { id: updateAccionDto.formularioId },
    });

    if (!formulario) {
      throw new NotFoundException(
        `Formulario with ID ${updateAccionDto.formularioId} not found`,
      );
    }

    await this.accionRepository.update(id, {
      nombre: updateAccionDto.nombre,
      formulario: formulario,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if accion exists

    // Remove this accion from all grupos that reference it
    // Find all grupos that have this accion
    const grupos = await this.grupoRepository
      .createQueryBuilder('grupo')
      .innerJoin('grupo.acciones', 'accion', 'accion.id = :accionId', {
        accionId: id,
      })
      .leftJoinAndSelect('grupo.acciones', 'acciones')
      .getMany();

    // Remove the accion from each grupo
    for (const grupo of grupos) {
      grupo.acciones = grupo.acciones.filter((a) => a.id !== id);
      await this.grupoRepository.save(grupo);
    }

    // Now we can safely delete the accion
    await this.accionRepository.delete(id);
  }
}
