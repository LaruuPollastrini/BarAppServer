// estado-pendiente.state.ts
import { StateReserva } from './state-reserva.entity';
import { AceptadaState } from './estado-aceptada.state';
import { RechazadaState } from './estado-rechazada.state';
import { CanceladaState } from './estado-cancelada.state';

export class PendienteState extends StateReserva {
  aceptar() {
    this.reserva.estado = 'Aceptada';
  }

  rechazar() {
    this.reserva.estado = 'Rechazada';
  }

  cancelar() {
    this.reserva.estado = 'Cancelada';
  }

  cerrar() {
    throw new Error('No se puede cerrar una reserva pendiente');
  }
}
