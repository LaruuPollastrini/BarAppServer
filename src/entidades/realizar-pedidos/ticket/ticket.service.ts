import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './tickets.entity';
import { Pedidos } from '../pedidos/pedidos.entity';
import { PedidoService } from '../pedidos/pedido.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @InjectRepository(Pedidos)
    private pedidosRepository: Repository<Pedidos>,
    @Inject(forwardRef(() => PedidoService))
    private pedidoService: PedidoService,
  ) {}

  findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find();
  }

  findOne(id: number): Promise<Ticket | null> {
    return this.ticketRepository.findOne({
      where: { idticket: id },
      relations: [
        'pedido',
        'pedido.detallespedido',
        'pedido.detallespedido.producto',
      ],
    });
  }

  async generar(
    id: number,
    options?: { skipCloseMesa?: boolean },
  ): Promise<Ticket | null> {
    const pedidoExistente = await this.pedidosRepository.findOne({
      where: { idpedido: id },
      relations: ['detallespedido', 'detallespedido.producto', 'mesa'],
    });

    if (!pedidoExistente) {
      throw new Error(`Pedido con ID ${id} no encontrado`);
    }

    let total = 0;
    pedidoExistente.detallespedido.forEach((detalle) => {
      total += detalle.cantidad * detalle.producto.precio;
    });

    const mesaId = pedidoExistente.mesa?.idmesa ?? null;
    const ticket = this.ticketRepository.create({ total, mesaId });
    const ticketCreado = await this.ticketRepository.save(ticket);

    pedidoExistente.ticket = ticketCreado;
    // Mantener estado Confirmado para que los reportes de ingresos y ticket promedio incluyan estos pedidos
    await this.pedidosRepository.save(pedidoExistente);

    // Close table and invalidate sessions when invoice is printed (unless skipped e.g. when closing mesa for multiple pedidos)
    if (!options?.skipCloseMesa && pedidoExistente.mesa?.idmesa) {
      await this.pedidoService.handleInvoicePrinted(
        pedidoExistente.mesa.idmesa,
      );
    }

    return ticketCreado;
  }

  /**
   * Get the last N tickets for a mesa (for re-print history).
   */
  async findLastByMesa(mesaId: number, limit = 5): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { mesaId },
      order: { fecha: 'DESC' },
      take: limit,
      relations: [
        'mesa',
        'pedido',
        'pedido.detallespedido',
        'pedido.detallespedido.producto',
      ],
    });
  }
}
