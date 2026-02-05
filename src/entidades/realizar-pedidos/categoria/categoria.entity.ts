import { PrimaryGeneratedColumn, Entity, Column, OneToMany } from 'typeorm';
import { Producto } from '../productos/productos.entity';

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

  @OneToMany(() => Producto, (producto) => producto.categoria)
  productos: Producto[];
}
