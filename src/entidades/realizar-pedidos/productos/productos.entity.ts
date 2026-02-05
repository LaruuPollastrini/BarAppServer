import { PrimaryGeneratedColumn, Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Categoria } from '../categoria/categoria.entity';

@Entity()
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column()
  precio: number;

  @ManyToOne(() => Categoria, { eager: true, nullable: true })
  @JoinColumn({ name: 'categoriaId' })
  categoria: Categoria | null;

  @Column({ default: false })
  estaEliminado: boolean;
}
