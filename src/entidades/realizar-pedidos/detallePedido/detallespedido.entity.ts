import { Formulario } from "src/entidades/seguridad/formulario/formulario.entity";
import { Grupo } from "src/entidades/seguridad/grupos/grupos.entity";
import { ManyToMany, PrimaryGeneratedColumn, Entity, Column, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Producto } from "../productos/productos.entity";
import { Pedidos } from "../pedidos/pedidos.entity";

@Entity()
export class DetallesPedido {
  @PrimaryGeneratedColumn()
  idDetalle: number;

  @Column()
  cantidad: number;

  @Column()
  precioUnitario: number;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'productoId' })
  producto: Producto;

  @ManyToOne(() => Pedidos, pedido => pedido.idpedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idpedido' })
  pedido: Pedidos;
}