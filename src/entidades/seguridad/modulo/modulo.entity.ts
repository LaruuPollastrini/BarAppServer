import { Formulario } from 'src/entidades/seguridad/formulario/formulario.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity()
export class Modulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Formulario, formulario => formulario.modulo)
  formularios: Formulario[];
}