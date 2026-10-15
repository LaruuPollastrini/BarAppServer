import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';

/** Aceptada: confirmada por el bar. Puede cancelarse o cerrarse (cuando el cliente asiste). */
export class AceptadaState extends StateReserva {
  readonly nombre = EstadoReserva.Aceptada;

  cancelar(): void {
    this.cambiarA(EstadoReserva.Cancelada);
  }

  cerrar(): void {
    this.cambiarA(EstadoReserva.Cerrada);
  }
}