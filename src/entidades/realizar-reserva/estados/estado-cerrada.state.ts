import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';

/** Cerrada: el cliente asistió. Estado final. No admite ninguna transición. */
export class CerradaState extends StateReserva {
  readonly nombre = EstadoReserva.Cerrada;
}