import { Reserva } from '../reservas/reserva.entity';
import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';
import { PendienteState } from './estado-pendiente.state';
import { AceptadaState } from './estado-aceptada.state';
import { RechazadaState } from './estado-rechazada.state';
import { CanceladaState } from './estado-cancelada.state';
import { CerradaState } from './estado-cerrada.state';

/**
 * FACTORY (creacional)
 *
 * Centraliza la creación del objeto estado correspondiente a una reserva.
 * El resto del sistema no necesita conocer las clases concretas de cada estado:
 * le pide el estado a la fábrica y trabaja contra la clase abstracta StateReserva.
 */
export class EstadoReservaFactory {
  static crear(reserva: Reserva): StateReserva {
    switch (reserva.estado) {
      case EstadoReserva.Pendiente:
        return new PendienteState(reserva);
      case EstadoReserva.Aceptada:
        return new AceptadaState(reserva);
      case EstadoReserva.Rechazada:
        return new RechazadaState(reserva);
      case EstadoReserva.Cancelada:
        return new CanceladaState(reserva);
      case EstadoReserva.Cerrada:
        return new CerradaState(reserva);
      default:
        throw new Error(
          `La reserva ${reserva.idReserva} tiene un estado desconocido: "${reserva.estado}"`,
        );
    }
  }
}