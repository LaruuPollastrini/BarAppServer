import {
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

  /**
   * Verification code used when the order was placed
   * WHY: Allows filtering orders by client session (mesa + codigoVerificacion)
   */
  @Column({ type: 'varchar', length: 10, nullable: true })
  codigoVerificacion: string | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  user: User | null;

  @OneToMany(() => DetallesPedido, (dp) => dp.pedido, { cascade: true })
  detallespedido: DetallesPedido[];

  @ManyToOne(() => Mesa, (mesa) => mesa.idmesa)
  @JoinColumn({ name: 'mesaId' })
  mesa: Mesa;

  @OneToOne(() => Ticket, (ticket) => ticket.idticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;
}
