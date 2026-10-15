import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Reserva } from '../reservas/reserva.entity';

/**
 * Agenda = un turno publicado por el bar (fecha + horario) con un cupo máximo de personas.
 * Los clientes solo pueden reservar sobre turnos activos, futuros y con cupo disponible.
 */
@Entity()
export class Agenda {
  @PrimaryGeneratedColumn()
  idAgenda!: number;

  // TypeORM devuelve las columnas DATE como texto 'YYYY-MM-DD'
  @Column({ type: 'date' })
  fecha!: string;

  // MySQL devuelve las columnas TIME como texto 'HH:MM:SS', ej: '21:00:00'
  @Column({ type: 'time' })
  horario!: string;

  // Cantidad máxima de personas que el bar acepta para este turno
  @Column({ type: 'int' })
  capacidad!: number;

  // Baja lógica: un turno con reservas no se borra, se desactiva
  @Column({ default: true })
  estaActiva!: boolean;

  @OneToMany(() => Reserva, (reserva) => reserva.agenda)
  reservas!: Reserva[];
}