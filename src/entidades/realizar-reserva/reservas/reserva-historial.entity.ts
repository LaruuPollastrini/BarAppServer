import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Reserva } from './reserva.entity';

/**
 * Cada fila es un cambio de estado de una reserva:
 * quién lo hizo, cuándo, y de qué estado a qué estado pasó.
 */
@Entity('reserva_historial')
export class ReservaHistorial {
  @PrimaryGeneratedColumn()
  idHistorial!: number;

  @ManyToOne(() => Reserva, (reserva) => reserva.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'reservaId' })
  reserva!: Reserva;

  // null cuando es la creación de la reserva
  @Column({ type: 'varchar', length: 50, nullable: true })
  estadoAnterior!: string | null;

  @Column({ type: 'varchar', length: 50 })
  estadoNuevo!: string;

  @CreateDateColumn({ type: 'datetime' })
  fecha!: Date;

  // Usuario que realizó el cambio (cliente o personal del bar)
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuarioId' })
  usuario!: User | null;
}