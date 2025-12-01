// estado-cancelada.state.ts
import { StateReserva } from './state-reserva.entity';

export class CanceladaState extends StateReserva {
  aceptar() {
    throw new Error('No se puede aceptar una reserva cancelada');
  }

  rechazar() {
    throw new Error('No se puede rechazar una reserva cancelada');
  }

  cancelar() {}

  cerrar() {
    throw new Error('No se puede cerrar una reserva cancelada');
  }
}
