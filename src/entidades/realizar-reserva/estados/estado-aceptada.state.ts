// estado-aceptada.state.ts
import { StateReserva } from './state-reserva.entity';
import { CerradaState } from './estado-cerrada.state';
import { CanceladaState } from './estado-cancelada.state';

export class AceptadaState extends StateReserva {
  aceptar() {
    // Ya está aceptada, no cambia
  }

  rechazar() {
    throw new Error('No se puede rechazar una reserva ya aceptada');
  }

  cancelar() {
    this.reserva.estado = 'Cancelada';
  }

  cerrar() {
    this.reserva.estado = 'Cerrada';
  }
}
