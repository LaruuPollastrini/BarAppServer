import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';

/** Pendiente: recién solicitada. Puede aceptarse, rechazarse o cancelarse. */
export class PendienteState extends StateReserva {
  readonly nombre = EstadoReserva.Pendiente;

  aceptar(): void {
    this.cambiarA(EstadoReserva.Aceptada);
  }

  rechazar(): void {
    this.cambiarA(EstadoReserva.Rechazada);
  }

  cancelar(): void {
    this.cambiarA(EstadoReserva.Cancelada);
  }
}