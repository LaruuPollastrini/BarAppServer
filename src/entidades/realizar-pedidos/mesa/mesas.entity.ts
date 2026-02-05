import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm';

@Entity()
export class Mesa {
  @PrimaryGeneratedColumn()
  idmesa: number;

  @Column()
  numero: number;

  @Column({ default: true })
  estaAbierta: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  visitToken: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigoVerificacion: string | null;
}
