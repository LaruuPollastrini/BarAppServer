import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Modulo } from './modulo.entity';
import { CreateModuloDto, UpdateModuloDto } from './modulo.dto';

@Injectable()
export class ModuloService {
  constructor(
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
  ) {}

  async findAll(): Promise<Modulo[]> {
    return this.moduloRepository.find({
      relations: ['formularios'],
    });
  }

  async findOne(id: number): Promise<Modulo> {
    const modulo = await this.moduloRepository.findOne({
      where: { id },
      relations: ['formularios'],
    });

    if (!modulo) {
      throw new NotFoundException(`Modulo with ID ${id} not found`);
    }

    return modulo;
  }

  async create(createModuloDto: CreateModuloDto): Promise<Modulo> {
    const modulo = this.moduloRepository.create(createModuloDto);
    return this.moduloRepository.save(modulo);
  }

  async update(id: number, updateModuloDto: UpdateModuloDto): Promise<Modulo> {
    const modulo = await this.findOne(id);
    await this.moduloRepository.update(id, updateModuloDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const modulo = await this.findOne(id);
    await this.moduloRepository.delete(id);
  }
}

