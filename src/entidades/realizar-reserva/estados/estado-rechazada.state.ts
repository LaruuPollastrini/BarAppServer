// estado-rechazada.state.ts
import { StateReserva } from './state-reserva.entity';

export class RechazadaState extends StateReserva {
  aceptar() {
    throw new Error('No se puede aceptar una reserva rechazada');
  }

  rechazar() {}
  cancelar() {}
  cerrar() {
    throw new Error('No se puede cerrar una reserva rechazada');
  }
}
