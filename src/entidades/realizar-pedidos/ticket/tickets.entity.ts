import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Mesa } from '../mesa/mesas.entity';
import { Pedidos } from '../pedidos/pedidos.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  idticket: number;

  @Column()
  total: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  /** Mesa this ticket belongs to (for re-print history) */
  @Column({ type: 'int', nullable: true })
  mesaId: number | null;

  @ManyToOne(() => Mesa, { nullable: true })
  @JoinColumn({ name: 'mesaId' })
  mesa: Mesa | null;

  /** Pedido asociado a este ticket (1 ticket = 1 pedido al generar) */
  @OneToOne(() => Pedidos, (pedido) => pedido.ticket)
  pedido?: Pedidos;
}
