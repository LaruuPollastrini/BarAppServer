import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';



// Estados concretos
import { StateReserva } from './state-reserva.entity';
import { PendienteState } from './estado-pendiente.state';
import { AceptadaState } from './estado-aceptada.state';
import { RechazadaState } from './estado-rechazada.state';
import { CanceladaState } from './estado-cancelada.state';
import { CerradaState } from './estado-cerrada.state';
import { Reserva } from '../reservas/reserva.entity';

@Injectable()
export class EstadoService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
  ) {}

  // =======================================================
  // Construir el estado correspondiente según reserva.estado
  // =======================================================
  private buildState(reserva: Reserva): StateReserva {
    switch (reserva.estado) {
      case 'Pendiente':
        return new PendienteState(reserva);
      case 'Aceptada':
        return new AceptadaState(reserva);
      case 'Rechazada':
        return new RechazadaState(reserva);
      case 'Cancelada':
        return new CanceladaState(reserva);
      case 'Cerrada':
        return new CerradaState(reserva);
      default:
        throw new Error(`Estado desconocido: ${reserva.estado}`);
    }
  }

  // ================================================
  // ACEPTAR
  // ================================================
  async aceptar(idReserva: number) {
    const reserva = await this.reservaRepo.findOne({
      where: { idReserva },
      relations: ['user', 'agenda'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const state = this.buildState(reserva);
    state.aceptar(); // transición del patrón State

    return this.reservaRepo.save(reserva);
  }

  // ================================================
  // RECHAZAR
  // ================================================
  async rechazar(idReserva: number) {
    const reserva = await this.reservaRepo.findOne({
      where: { idReserva },
      relations: ['user', 'agenda'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const state = this.buildState(reserva);
    state.rechazar();

    return this.reservaRepo.save(reserva);
  }

  // ================================================
  // CANCELAR
  // ================================================
  async cancelar(idReserva: number) {
    const reserva = await this.reservaRepo.findOne({
      where: { idReserva },
      relations: ['user', 'agenda'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const state = this.buildState(reserva);
    state.cancelar();

    return this.reservaRepo.save(reserva);
  }

  // ================================================
  // CERRAR
  // ================================================
  async cerrar(idReserva: number) {
    const reserva = await this.reservaRepo.findOne({
      where: { idReserva },
      relations: ['user', 'agenda'],
    });

    if (!reserva) throw new NotFoundException('Reserva no encontrada');

    const state = this.buildState(reserva);
    state.cerrar();

    return this.reservaRepo.save(reserva);
  }
}
