/**
 * Body para crear una reserva. El cliente NO se envía: se toma del usuario logueado (token).
 * Ej: { "agendaId": 3, "cantidadPersonas": 4 }
 */
export interface CrearReservaDto {
  agendaId: number;
  cantidadPersonas: number;
}

export interface TurnoResumenDto {
  idAgenda: number;
  fecha: string;
  horario: string;
}

export interface ClienteResumenDto {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
}

export interface HistorialDto {
  estadoAnterior: string | null;
  estadoNuevo: string;
  fecha: Date;
  usuario: string | null; // nombre de quien hizo el cambio
}

/**
 * Lo que devuelve la API sobre una reserva.
 * Nunca se devuelve la entidad User completa (tiene la contraseña hasheada).
 */
export interface ReservaRespuestaDto {
  idReserva: number;
  cantidadPersonas: number;
  estado: string;
  fechaSolicitud: Date;
  puedeCancelar: boolean; // el frontend lo usa para mostrar u ocultar el botón "Cancelar"
  turno: TurnoResumenDto | null;
  cliente?: ClienteResumenDto; // solo para el personal del bar
  historial?: HistorialDto[]; // solo en el detalle
}