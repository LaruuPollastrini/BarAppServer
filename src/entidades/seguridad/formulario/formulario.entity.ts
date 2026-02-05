import { Accion } from 'src/entidades/seguridad/acciones/acciones.entity';
import { Grupo } from 'src/entidades/seguridad/grupos/grupos.entity';
import { Modulo } from 'src/entidades/seguridad/modulo/modulo.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Formulario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToMany(() => Accion, (accion) => accion.formularios)
  acciones: Accion[];

  @ManyToOne(() => Modulo, (modulo) => modulo.formularios, { eager: true })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;

  @ManyToMany(() => Grupo, (grupo) => grupo.formularios)
  grupos: Grupo[];
}
