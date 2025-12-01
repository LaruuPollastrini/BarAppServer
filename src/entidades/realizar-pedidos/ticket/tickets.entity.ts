import { PrimaryGeneratedColumn, Entity, Column } from "typeorm";

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  idticket: number;

  @Column()
  total: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}