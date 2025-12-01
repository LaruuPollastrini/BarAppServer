// state-reserva.entity.ts

import { Reserva } from "../reservas/reserva.entity";


export abstract class StateReserva {
  protected reserva: Reserva;

  constructor(reserva: Reserva) {
    this.reserva = reserva;
  }

  abstract aceptar(): void;
  abstract rechazar(): void;
  abstract cancelar(): void;
  abstract cerrar(): void;
}
