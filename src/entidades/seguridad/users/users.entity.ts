import { Pedidos } from 'src/entidades/realizar-pedidos/pedidos/pedidos.entity';
import { Grupo } from 'src/entidades/seguridad/grupos/grupos.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  Nombre: string;

  @Column()
  Apellido: string;

  @Column()
  Correo: string;

  @Column()
  Contrasena: string;

  @Column()
  Telefono: string;

  @Column({ default: true })
  EstaActivo: boolean;

  @ManyToMany(() => Pedidos, pedidos => pedidos.user)
  @JoinTable({
    name: 'usuario_pedido',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'pedido_id', referencedColumnName: 'idpedido' },
  })
  pedidos: Pedidos[];

  @ManyToMany(() => Grupo, grupo => grupo.usuarios)
  @JoinTable({
    name: 'usuario_grupo',
    joinColumn: { name: 'usuario_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
  })
  grupos: Grupo[];

  // ← Verifica si tiene una acción específica
  tieneAccion(nombreAccion: string): boolean {
    if (!this.grupos || this.grupos.length === 0) return false;
    
    return this.grupos.some(grupo => grupo.tieneAccion(nombreAccion));
  }

  // ← Obtiene todas las acciones del usuario
  obtenerAcciones(): string[] {
    if (!this.grupos || this.grupos.length === 0) return [];
    
    const acciones = new Set<string>();
    this.grupos.forEach(grupo => {
      grupo.obtenerAcciones().forEach(a => acciones.add(a));
    });
    return Array.from(acciones);
  }
}