import { PrimaryGeneratedColumn, Entity, Column } from 'typeorm';

@Entity()
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ nullable: true, type: 'varchar', length: 500 })
  descripcion: string | null;

  @Column({ default: false })
  estaEliminado: boolean;
}
