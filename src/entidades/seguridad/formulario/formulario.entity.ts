import { Accion } from 'src/entidades/seguridad/acciones/acciones.entity';
import { Modulo } from 'src/entidades/seguridad/modulo/modulo.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class Formulario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @OneToMany(() => Accion, accion => accion.formulario)
  acciones: Accion[];

  @ManyToOne(() => Modulo, modulo => modulo.formularios, { eager: true })
  @JoinColumn({ name: 'modulo_id' })
  modulo: Modulo;
}