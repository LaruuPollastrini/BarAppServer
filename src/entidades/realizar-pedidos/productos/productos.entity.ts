import { Formulario } from "src/entidades/seguridad/formulario/formulario.entity";
import { Grupo } from "src/entidades/seguridad/grupos/grupos.entity";
import { ManyToMany, PrimaryGeneratedColumn, Entity, Column, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { DetallesPedido } from "../detallePedido/detallespedido.entity";

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

  @Column({default: false})
  estaEliminado: boolean;
}