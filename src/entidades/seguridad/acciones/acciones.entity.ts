import { Formulario } from 'src/entidades/seguridad/formulario/formulario.entity';
import { Grupo } from 'src/entidades/seguridad/grupos/grupos.entity';
import {
  ManyToMany,
  PrimaryGeneratedColumn,
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

@Entity()
export class Accion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToMany(() => Grupo, (grupo) => grupo.acciones)
  grupos: Grupo[];

  @ManyToOne(() => Formulario, (formulario) => formulario.acciones)
  @JoinColumn({ name: 'formulario_id' })
  formulario: Formulario;
}
