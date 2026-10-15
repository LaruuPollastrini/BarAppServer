/**
 * Estados posibles de una reserva (ciclo de vida definido en el diagrama de transición de estados).
 */
export enum EstadoReserva {
  Pendiente = 'Pendiente',
  Aceptada = 'Aceptada',
  Rechazada = 'Rechazada',
  Cancelada = 'Cancelada',
  Cerrada = 'Cerrada',
}

/**
 * Estados que "ocupan" lugar en un turno de la agenda.
 * Una reserva rechazada o cancelada libera el cupo; una cerrada ya pasó.
 */
export const ESTADOS_QUE_OCUPAN_CUPO: string[] = [
  EstadoReserva.Pendiente,
  EstadoReserva.Aceptada,
];