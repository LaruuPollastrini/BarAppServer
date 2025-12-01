
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './tickets.entity';
import { Pedidos } from '../pedidos/pedidos.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Pedidos)
    private pedidosRepository: Repository<Pedidos>,
  ) {}

  findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find();
  }

  findOne(id: number): Promise<Ticket | null> {
    return this.ticketRepository.findOneBy({ idticket: id});
  }

  async generar(id: number): Promise<Ticket | null> {
  const pedidoExistente = await this.pedidosRepository.findOne({
    where: { idpedido: id },
    relations: ['detallespedido', 'detallespedido.producto'],
  });

  if (!pedidoExistente) {
    throw new Error(`Pedido con ID ${id} no encontrado`);
  }

  let total = 0;
  pedidoExistente.detallespedido.forEach((detalle) => {
    total += detalle.cantidad * detalle.producto.precio;
  });

  const ticket = this.ticketRepository.create({ total });
  const ticketCreado = await this.ticketRepository.save(ticket);

  pedidoExistente.ticket = ticketCreado;
  pedidoExistente.estado = 'Cerrado'; // Cambiar el estado del pedido a Cerrado
  await this.pedidosRepository.save(pedidoExistente);

  return ticketCreado;
}
}
