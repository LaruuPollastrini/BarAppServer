/**
 * Publicar un turno puntual.
 * Ej: { "fecha": "2026-10-24", "horario": "21:00", "capacidad": 30 }
 */
export interface CrearAgendaDto {
  fecha: string; // 'YYYY-MM-DD'
  horario: string; // 'HH:MM'
  capacidad: number; // personas
}

/**
 * Publicar muchos turnos de una vez (CUD 006 - Cargar rango de fechas y horarios).
 * Ej: del 20 al 31 de octubre, viernes y sábados, de 20:00 a 23:00 cada 60 minutos, 30 personas por turno.
 * {
 *   "fechaDesde": "2026-10-20", "fechaHasta": "2026-10-31",
 *   "diasSemana": [5, 6],
 *   "horaInicio": "20:00", "horaFin": "23:00",
 *   "intervaloMinutos": 60, "capacidad": 30
 * }
 * diasSemana: 0 = domingo, 1 = lunes, ..., 6 = sábado. Si no se envía, se usan todos los días.
 * horaFin es el horario del ÚLTIMO turno (incluido).
 */
export interface CrearRangoAgendaDto {
  fechaDesde: string;
  fechaHasta: string;
  diasSemana?: number[];
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  capacidad: number;
}

/**
 * Turno de la agenda con el cupo calculado (lo que devuelven los listados).
 */
export interface AgendaConCupoDto {
  idAgenda: number;
  fecha: string;
  horario: string;
  capacidad: number;
  estaActiva: boolean;
  ocupados: number; // personas en reservas Pendientes o Aceptadas
  cupoDisponible: number;
}

export interface ResultadoRangoDto {
  creados: number;
  omitidos: number; // turnos que ya estaban publicados
  turnos: AgendaConCupoDto[];
}