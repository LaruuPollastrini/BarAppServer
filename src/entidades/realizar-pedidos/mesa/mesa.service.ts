import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa } from './mesas.entity';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private mesasRepository: Repository<Mesa>,
  ) {}

  findAll(): Promise<Mesa[]> {
    return this.mesasRepository.find();
  }

  findOne(id: number): Promise< Mesa | null> {
    return this.mesasRepository.findOneBy({ idmesa: id });
  }

  async remove(id: number): Promise<void> {
    await this.mesasRepository.delete(id);
  }
  

  async agregar(numero: number): Promise<void> {
    try {
          if(numero <= 0) {
      throw new Error('El precio no puede ser menor o igual a cero');
          }
      const MesaExistente = await this.mesasRepository.findOneBy({numero});
    if (MesaExistente) {
      throw new Error(`Mesa con numero ${numero} ya existe`);
    }
    const nuevoMesa = this.mesasRepository.create({numero });
    await this.mesasRepository.save(nuevoMesa);
  }
    catch (error) {
      throw new Error(`Error al agregar mesa: ${error.message}`);
    }
  }

  async modificar(mesa: Mesa): Promise<void> {
      try {
        const mesaExistente = await this.mesasRepository.findOneBy({ idmesa: mesa.idmesa});
        if (!mesaExistente) {
          throw new Error(`Producto con ID ${mesa.idmesa} no encontrado`);
        }
            if(mesa.numero <= 0) {
        throw new Error('la mesa no puede ser menor o igual a cero');
            }
        await this.mesasRepository.update({ idmesa: mesa.idmesa }, mesa);
      } catch (error) {
        throw new Error(`Error al modificar la mesa: ${error.message}`);
      }
    }
}