import { Formulario } from "src/entidades/seguridad/formulario/formulario.entity";
import { Grupo } from "src/entidades/seguridad/grupos/grupos.entity";
import { ManyToMany, PrimaryGeneratedColumn, Entity, Column, JoinColumn, ManyToOne } from "typeorm";

@Entity()
export class Mesa {
  @PrimaryGeneratedColumn()
  idmesa: number;

  @Column()
  numero: number;
}