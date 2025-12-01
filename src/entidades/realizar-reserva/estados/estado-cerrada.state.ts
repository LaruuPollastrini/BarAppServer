// estado-cerrada.state.ts
import { StateReserva } from './state-reserva.entity';

export class CerradaState extends StateReserva {
  aceptar() {
    throw new Error('No se puede aceptar una reserva cerrada');
  }

  rechazar() {
    throw new Error('No se puede rechazar una reserva cerrada');
  }

  cancelar() {
    throw new Error('No se puede cancelar una reserva cerrada');
  }

  cerrar() {}
}

