import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from './modulo.entity';
import { CreateModuloDto, UpdateModuloDto, ModuloResponseDto } from './modulo.dto';

@Injectable()
export class ModuloService {
  constructor(
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
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
    const modulo = this.moduloRepository.create(createModuloDto);
    return this.moduloRepository.save(modulo);
  }

  async update(id: number, updateModuloDto: UpdateModuloDto): Promise<ModuloResponseDto> {
    const modulo = await this.findOne(id);
    await this.moduloRepository.update(id, updateModuloDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const modulo = await this.findOne(id);
    await this.moduloRepository.delete(id);
  }
}

