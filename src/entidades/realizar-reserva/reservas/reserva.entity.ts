import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from 'src/entidades/seguridad/users/users.entity';
import { Agenda } from '../agenda/agenda.entity';

@Entity()
export class Reserva {
  @PrimaryGeneratedColumn()
  idReserva: number;

  @Column()
  cantidadPersonas: number;
  
  @Column({ type: 'varchar', length: 50 })
  estado: string;
 
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'clienteId' })
  user: User;

  @ManyToOne(() => Agenda, (agenda) => agenda.reservas)
  @JoinColumn({ name: 'agendaId' })
  agenda: Agenda;
}

