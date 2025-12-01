import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formulario } from './formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { CreateFormularioDto, UpdateFormularioDto } from './formulario.dto';

@Injectable()
export class FormularioService {
  constructor(
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
  ) {}

  async findAll(): Promise<Formulario[]> {
    return this.formularioRepository.find({
      relations: ['modulo', 'acciones'],
    });
  }

  async findOne(id: number): Promise<Formulario> {
    const formulario = await this.formularioRepository.findOne({
      where: { id },
      relations: ['modulo', 'acciones'],
    });

    if (!formulario) {
      throw new NotFoundException(`Formulario with ID ${id} not found`);
    }

    return formulario;
  }

  async create(createFormularioDto: CreateFormularioDto): Promise<Formulario> {
    const modulo = await this.moduloRepository.findOne({
      where: { id: createFormularioDto.modulo_id },
    });

    if (!modulo) {
      throw new NotFoundException(
        `Modulo with ID ${createFormularioDto.modulo_id} not found`,
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
  ): Promise<Formulario> {
    await this.findOne(id); // Check if formulario exists

    const modulo = await this.moduloRepository.findOne({
      where: { id: updateFormularioDto.modulo_id },
    });

    if (!modulo) {
      throw new NotFoundException(
        `Modulo with ID ${updateFormularioDto.modulo_id} not found`,
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

