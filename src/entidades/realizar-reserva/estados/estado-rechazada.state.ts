import { StateReserva } from './state-reserva';
import { EstadoReserva } from './estado-reserva.enum';

/** Rechazada: estado final. No admite ninguna transición. */
export class RechazadaState extends StateReserva {
  readonly nombre = EstadoReserva.Rechazada;
}