import { Formulario } from 'src/entidades/seguridad/formulario/formulario.entity';
import { Grupo } from 'src/entidades/seguridad/grupos/grupos.entity';
import {
  ManyToMany,
  PrimaryGeneratedColumn,
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Mesa } from '../mesa/mesas.entity';
import { Ticket } from '../ticket/tickets.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';

@Entity()
export class Pedidos {
  @PrimaryGeneratedColumn()
  idpedido: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column()
  estado: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'clienteId' })
  user: User;

  @OneToMany(() => DetallesPedido, (dp) => dp.pedido, {cascade: true})
  detallespedido: DetallesPedido[];
  

  @OneToOne(() => Mesa, (mesa) => mesa.idmesa)
  @JoinColumn({ name: 'mesaId' })
  mesa: Mesa;

  @OneToOne(() => Ticket, (ticket) => ticket.idticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;
}
