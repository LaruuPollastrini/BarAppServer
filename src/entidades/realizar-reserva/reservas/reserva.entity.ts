import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Agenda } from '../agenda/agenda.entity';
import { ReservaHistorial } from './reserva-historial.entity';

@Entity()
export class Reserva {
  @PrimaryGeneratedColumn()
  idReserva!: number;

  @Column()
  cantidadPersonas!: number;

  // Pendiente | Aceptada | Rechazada | Cancelada | Cerrada (lo maneja el patrón State)
  @Column({ type: 'varchar', length: 50, default: 'Pendiente' })
  estado!: string;

  // Momento en que el cliente solicitó la reserva
  @CreateDateColumn({ type: 'datetime' })
  fechaSolicitud!: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'clienteId' })
  user!: User;

  @ManyToOne(() => Agenda, (agenda) => agenda.reservas)
  @JoinColumn({ name: 'agendaId' })
  agenda!: Agenda;

  // Registro histórico de cada cambio de estado (RF10 y anexo de Auditoría)
  @OneToMany(() => ReservaHistorial, (h) => h.reserva)
  historial!: ReservaHistorial[];
}