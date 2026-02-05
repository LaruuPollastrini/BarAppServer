import { Formulario } from 'src/entidades/seguridad/formulario/formulario.entity';
import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('accion')
export class Accion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @ManyToMany(() => Formulario, (formulario) => formulario.acciones)
  @JoinTable({
    name: 'accion_formulario',
    joinColumn: { name: 'accion_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'formulario_id', referencedColumnName: 'id' },
  })
  formularios: Formulario[];
}
