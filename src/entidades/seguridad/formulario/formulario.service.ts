import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formulario } from './formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { CreateFormularioDto, UpdateFormularioDto, FormularioResponseDto } from './formulario.dto';

@Injectable()
export class FormularioService {
  constructor(
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
  ) {}

  private transformToResponseDto(formulario: Formulario): FormularioResponseDto {
    return {
      id: formulario.id,
      nombre: formulario.nombre,
      modulo: formulario.modulo
        ? {
            id: formulario.modulo.id,
            nombre: formulario.modulo.nombre,
          }
        : undefined,
      acciones: formulario.acciones?.map((accion) => ({
        id: accion.id,
        nombre: accion.nombre,
      })),
    };
  }

  async findAll(): Promise<FormularioResponseDto[]> {
    const formularios = await this.formularioRepository.find({
      relations: ['modulo', 'acciones'],
    });
    return formularios.map((formulario) => this.transformToResponseDto(formulario));
  }

  async findOne(id: number): Promise<FormularioResponseDto> {
    const formulario = await this.formularioRepository.findOne({
      where: { id },
      relations: ['modulo', 'acciones'],
    });

    if (!formulario) {
      throw new NotFoundException(`Formulario with ID ${id} not found`);
    }

    return this.transformToResponseDto(formulario);
  }

  async create(createFormularioDto: CreateFormularioDto): Promise<FormularioResponseDto> {
    const modulo = await this.moduloRepository.findOne({
      where: { id: createFormularioDto.moduloId },
    });

    if (!modulo) {
      throw new NotFoundException(
        `Modulo with ID ${createFormularioDto.moduloId} not found`,
      );
    }

    const formulario = this.formularioRepository.create({
      nombre: createFormularioDto.nombre,
      modulo: modulo,
    });

    return this.formularioRepository.save(formulario);
  }

  async update(
    id: number,
    updateFormularioDto: UpdateFormularioDto,
  ): Promise<FormularioResponseDto> {
    await this.findOne(id); // Check if formulario exists

    const modulo = await this.moduloRepository.findOne({
      where: { id: updateFormularioDto.moduloId },
    });

    if (!modulo) {
      throw new NotFoundException(
        `Modulo with ID ${updateFormularioDto.moduloId} not found`,
      );
    }

    await this.formularioRepository.update(id, {
      nombre: updateFormularioDto.nombre,
      modulo: modulo,
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if formulario exists
    await this.formularioRepository.delete(id);
  }
}

