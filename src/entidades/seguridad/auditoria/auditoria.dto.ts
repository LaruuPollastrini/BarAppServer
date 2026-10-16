export interface EventoSesionDto {
  id: number;
  fecha: Date;
  tipo: string;
  correo: string;
  usuario: string | null; // "Nombre Apellido"
  detalle: string | null;
  ip: string | null;
}

export interface ReporteSesionesDto {
  resumen: {
    logins: number;
    loginsFallidos: number;
    logouts: number;
  };
  eventos: EventoSesionDto[];
}

export interface CambioReservaDto {
  idHistorial: number;
  fecha: Date;
  idReserva: number;
  cliente: string | null;
  turno: { fecha: string; horario: string } | null;
  cantidadPersonas: number | null;
  estadoAnterior: string | null; // null = creación de la reserva
  estadoNuevo: string;
  realizadoPor: string | null;
}