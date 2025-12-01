import { Accion } from 'src/entidades/seguridad/acciones/acciones.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity()
export class Grupo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ default: true })
  Estado: boolean;

  @ManyToMany(() => User, (usuario) => usuario.grupos)
  usuarios: User[];

  @ManyToMany(() => Accion, (accion) => accion.grupos)
  @JoinTable({
    name: 'grupo_accion',
    joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'accion_id', referencedColumnName: 'id' },
  })
  acciones: Accion[];

  // ← COMPOSITE: Un grupo puede contener otros grupos
  @ManyToMany(() => Grupo, (grupo) => grupo.gruposHijos)
  @JoinTable({
    name: 'grupo_jerarquia',
    joinColumn: { name: 'grupo_padre_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'grupo_hijo_id', referencedColumnName: 'id' },
  })
  gruposPadres: Grupo[];

  @ManyToMany(() => Grupo, (grupo) => grupo.gruposPadres)
  gruposHijos: Grupo[];

  // ← Verifica si tiene una acción (recursivo)
  tieneAccion(nombreAccion: string): boolean {
    // Busca en acciones directas
    const tieneDirecta = this.acciones?.some((a) => a.nombre === nombreAccion);
    if (tieneDirecta) return true;

    // Busca en grupos padres (recursivo)
    if (!this.gruposPadres || this.gruposPadres.length === 0) return false;
    return this.gruposPadres.some((g) => g.tieneAccion(nombreAccion));
  }

  // ← Obtiene todas las acciones (recursivo)
  obtenerAcciones(): string[] {
    const acciones = new Set<string>();

    // Acciones directas
    this.acciones?.forEach((a) => {
      acciones.add(`${a.formulario?.nombre || 'sin-form'}.${a.nombre}`);
    });

    // Acciones de grupos padres (recursivo)
    this.gruposPadres?.forEach((grupo) => {
      grupo.obtenerAcciones().forEach((a) => acciones.add(a));
    });

    return Array.from(acciones);
  }
}
