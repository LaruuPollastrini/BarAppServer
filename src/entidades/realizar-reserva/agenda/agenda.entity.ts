import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Reserva } from '../reservas/reserva.entity';


@Entity()
export class Agenda {
  @PrimaryGeneratedColumn()
  idAgenda: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  horario: string; // Ej: "21:00"

  @OneToMany(() => Reserva, (reserva) => reserva.agenda)
  reservas: Reserva[];
}

