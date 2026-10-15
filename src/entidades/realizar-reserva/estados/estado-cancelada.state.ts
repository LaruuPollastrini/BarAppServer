import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';

/** Cancelada: estado final. No admite ninguna transición. */
export class CanceladaState extends StateReserva {
  readonly nombre = EstadoReserva.Cancelada;
}