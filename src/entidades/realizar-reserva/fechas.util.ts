import { BadRequestException } from '@nestjs/common';

/**
 * Utilidades de fechas compartidas por el core de reservas.
 * Las fechas viajan como texto 'YYYY-MM-DD' y los horarios como 'HH:MM:SS'.
 */

export function parsearFecha(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function formatearFecha(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

export function hoy(): string {
  return formatearFecha(new Date());
}

/** true si la fecha + horario es posterior al momento actual. */
export function esFuturo(fecha: string, horario: string): boolean {
  return new Date(`${fecha}T${horario}`).getTime() > Date.now();
}

/** Valida 'YYYY-MM-DD' y que sea una fecha real. */
export function validarFecha(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new BadRequestException(
      `El campo "${campo}" debe tener el formato AAAA-MM-DD`,
    );
  }
  if (formatearFecha(parsearFecha(valor)) !== valor) {
    throw new BadRequestException(`El campo "${campo}" no es una fecha válida`);
  }
  return valor;
}