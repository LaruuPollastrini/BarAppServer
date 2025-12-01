import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accion } from './acciones.entity';
import { Formulario } from '../formulario/formulario.entity';
import { Grupo } from '../grupos/grupos.entity';
import { CreateAccionDto, UpdateAccionDto } from './acciones.dto';

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

  async findAll(): Promise<Accion[]> {
    return this.accionRepository.find({
      relations: ['formulario', 'grupos'],
    });
  }

  async findOne(id: number): Promise<Accion> {
    const accion = await this.accionRepository.findOne({
      where: { id },
      relations: ['formulario', 'grupos'],
    });

    if (!accion) {
      throw new NotFoundException(`Accion with ID ${id} not found`);
    }

    return accion;
  }

  async create(createAccionDto: CreateAccionDto): Promise<Accion> {
    const formulario = await this.formularioRepository.findOne({
      where: { id: createAccionDto.formulario_id },
    });

    if (!formulario) {
      throw new NotFoundException(
        `Formulario with ID ${createAccionDto.formulario_id} not found`,
      );
    }

    const accion = this.accionRepository.create({
      nombre: createAccionDto.nombre,
      formulario: formulario,
    });

    return this.accionRepository.save(accion);
  }

  async update(id: number, updateAccionDto: UpdateAccionDto): Promise<Accion> {
    await this.findOne(id); // Check if accion exists

    const formulario = await this.formularioRepository.findOne({
      where: { id: updateAccionDto.formulario_id },
    });

    if (!formulario) {
      throw new NotFoundException(
        `Formulario with ID ${updateAccionDto.formulario_id} not found`,
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
