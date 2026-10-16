export interface PeriodoDto {
  desde: string;
  hasta: string;
}

// ============ Reporte 1: Ocupación por turno ============

export interface OcupacionTurnoDto {
  idAgenda: number;
  fecha: string;
  horario: string; // 'HH:MM'
  diaSemana: string;
  capacidad: number;
  reservas: number;
  personasReservadas: number;
  porcentajeOcupacion: number;
}

export interface OcupacionAgrupadaDto {
  etiqueta: string; // ej. 'Viernes' o '21:00'
  turnos: number;
  capacidad: number;
  personasReservadas: number;
  porcentajeOcupacion: number;
}

export interface ReporteOcupacionDto {
  resumen: {
    periodo: PeriodoDto;
    turnos: number;
    capacidadTotal: number;
    personasReservadas: number;
    ocupacionPromedio: number; // %
    turnoMasDemandado: OcupacionTurnoDto | null;
  };
  porTurno: OcupacionTurnoDto[]; // para el gráfico de barras por turno
  porDiaSemana: OcupacionAgrupadaDto[]; // ¿qué días conviene abrir más turnos?
  porHorario: OcupacionAgrupadaDto[]; // ¿qué horarios se llenan más?
}

// ============ Reporte 2: Reservas por estado ============

export interface EstadoCantidadDto {
  estado: string;
  cantidad: number;
  personas: number;
  porcentaje: number;
}

export interface ReporteEstadosDto {
  resumen: {
    periodo: PeriodoDto;
    totalReservas: number;
    totalPersonas: number;
    tasaCancelacion: number; // % del total
    tasaRechazo: number; // % del total
    tasaAsistencia: number | null; // % de reservas aceptadas (de turnos ya pasados) que se cerraron
  };
  porEstado: EstadoCantidadDto[]; // para el gráfico de torta / barras
}