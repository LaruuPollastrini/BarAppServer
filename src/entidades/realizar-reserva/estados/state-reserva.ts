import { BadRequestException } from '@nestjs/common';
import { Reserva } from '../reservas/reserva.entity';
import { EstadoReserva } from './estado-reserva.enum';

/**
 * PATRÓN STATE (comportamiento)
 *
 * Cada estado de la reserva es una clase que decide qué transiciones están permitidas.
 * Por defecto, ninguna acción está permitida: cada estado concreto sobrescribe
 * solo las que corresponden según el diagrama de transición de estados.
 *
 * Contexto: la entidad Reserva (su campo "estado" guarda el nombre del estado actual).
 */
export abstract class StateReserva {
  abstract readonly nombre: EstadoReserva;

  constructor(protected readonly reserva: Reserva) {}

  aceptar(): void {
    this.noPermitido('aceptar');
  }

  rechazar(): void {
    this.noPermitido('rechazar');
  }

  cancelar(): void {
    this.noPermitido('cancelar');
  }

  cerrar(): void {
    this.noPermitido('cerrar');
  }

  protected cambiarA(nuevoEstado: EstadoReserva): void {
    this.reserva.estado = nuevoEstado;
  }

  private noPermitido(accion: string): never {
    throw new BadRequestException(
      `No se puede ${accion} una reserva en estado "${this.nombre}"`,
    );
  }
}