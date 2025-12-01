import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallesPedido } from './detallespedido.entity';

@Injectable()
export class DetallesPedidoService {
  constructor(
    @InjectRepository(DetallesPedido)
    private detallePedidoRepository: Repository<DetallesPedido>,
  ) {}

  findAll(): Promise<DetallesPedido[]> {
    return this.detallePedidoRepository.find();
  }

  findOne(id: number): Promise< DetallesPedido | null> {
    return this.detallePedidoRepository.findOneBy({ idDetalle: id });
  }

  async remove(id: number): Promise<void> {
    await this.detallePedidoRepository.delete(id);
  }
}