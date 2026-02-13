import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa } from './mesas.entity';
import { Pedidos } from '../pedidos/pedidos.entity';
import { randomInt } from 'crypto';
import { TicketsService } from '../ticket/ticket.service';
import { PedidoService } from '../pedidos/pedido.service';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private mesasRepository: Repository<Mesa>,
    @InjectRepository(Pedidos)
    private pedidosRepository: Repository<Pedidos>,
    private ticketService: TicketsService,
    private pedidoService: PedidoService,
  ) {}

  findAll(): Promise<Mesa[]> {
    return this.mesasRepository.find();
  }

  findOne(id: number): Promise<Mesa | null> {
    return this.mesasRepository.findOneBy({ idmesa: id });
  }

  async remove(id: number): Promise<void> {
    await this.mesasRepository.delete(id);
  }

  async agregar(numero: number): Promise<void> {
    if (numero <= 0) {
      throw new BadRequestException(
        'El número de mesa no puede ser menor o igual a cero',
      );
    }
    const mesaExistente = await this.mesasRepository.findOneBy({ numero });
    if (mesaExistente) {
      throw new ConflictException(`Ya existe una mesa con el número ${numero}`);
    }
    const codigoVerificacion = this.generateVerificationCode();
    const nuevoMesa = this.mesasRepository.create({
      numero,
      estaAbierta: true,
      codigoVerificacion,
    });
    await this.mesasRepository.save(nuevoMesa);
  }

  async findByNumero(numero: number): Promise<Mesa | null> {
    return this.mesasRepository.findOneBy({ numero });
  }

  /**
   * Generates a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return randomInt(100000, 999999).toString();
  }

  async updateStatus(idmesa: number, estaAbierta: boolean): Promise<void> {
    const mesa = await this.mesasRepository.findOneBy({ idmesa });
    if (!mesa) {
      throw new NotFoundException(`Mesa con ID ${idmesa} no encontrada`);
    }

    // If opening the table, generate a new verification code
    if (estaAbierta && !mesa.estaAbierta) {
      const codigoVerificacion = this.generateVerificationCode();
      await this.mesasRepository.update(
        { idmesa },
        { estaAbierta, codigoVerificacion },
      );
      return;
    }

    // Closing the table: check for pending pedidos, generate tickets for confirmed, then close
    if (!estaAbierta && mesa.estaAbierta) {
      const pedidosPendientes = await this.pedidosRepository.find({
        where: { mesa: { idmesa }, estado: 'Pendiente' },
      });
      if (pedidosPendientes.length > 0) {
        throw new BadRequestException(
          'Hay pedidos pendientes. Confirme o rechace los pedidos antes de cerrar la mesa.',
        );
      }

      // Generate ticket for each confirmed pedido that doesn't have one yet
      const pedidosConfirmados = await this.pedidosRepository.find({
        where: { mesa: { idmesa }, estado: 'Confirmado' },
        relations: ['ticket'],
      });
      for (const p of pedidosConfirmados) {
        if (!p.ticket) {
          await this.ticketService.generar(p.idpedido, { skipCloseMesa: true });
        }
      }

      // Close mesa and invalidate sessions (same as after printing invoice)
      await this.pedidoService.handleInvoicePrinted(idmesa);
      return;
    }

    // Other status update (e.g. already closed)
    await this.mesasRepository.update({ idmesa }, { estaAbierta });
  }

  /**
   * Verifies a code for a specific table
   * Returns true if the code matches, false otherwise
   */
  async verifyCode(numeroMesa: number, codigo: string): Promise<boolean> {
    const mesa = await this.mesasRepository.findOneBy({ numero: numeroMesa });
    if (!mesa) {
      return false;
    }
    if (!mesa.estaAbierta) {
      return false;
    }
    return mesa.codigoVerificacion === codigo;
  }

  async modificar(mesa: Mesa): Promise<void> {
    const mesaExistente = await this.mesasRepository.findOneBy({
      idmesa: mesa.idmesa,
    });
    if (!mesaExistente) {
      throw new NotFoundException(`Mesa con ID ${mesa.idmesa} no encontrada`);
    }
    if (mesa.numero <= 0) {
      throw new BadRequestException(
        'El número de mesa no puede ser menor o igual a cero',
      );
    }
    await this.mesasRepository.update({ idmesa: mesa.idmesa }, mesa);
  }
}
