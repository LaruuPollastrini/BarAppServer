import { Formulario } from 'src/entidades/seguridad/formulario/formulario.entity';
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
  estaActivo: boolean;

  @ManyToMany(() => User, (usuario) => usuario.grupos)
  usuarios: User[];

  @ManyToMany(() => Formulario, (formulario) => formulario.grupos)
  @JoinTable({
    name: 'grupo_formulario',
    joinColumn: { name: 'grupo_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'formulario_id', referencedColumnName: 'id' },
  })
  formularios: Formulario[];

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

  // ← Verifica si tiene una acción (recursivo): Grupo -> Formularios -> Acciones
  tieneAccion(nombreAccion: string): boolean {
    const formularioNameMapping: Record<string, string> = {
      'Gestionar Productos': 'Productos',
      'Gestionar Categorias': 'Categorias',
      'Gestionar Mesas': 'Mesas',
      'Gestionar Pedidos': 'Pedidos',
      'Visualizar Reportes': 'Reportes',
      'Gestionar Usuarios': 'Usuarios',
      'Gestionar Grupos': 'Grupos',
      'Gestionar Modulos': 'Modulos',
      'Gestionar Formularios': 'Formularios',
      'Ver Acciones': 'Acciones',
    };

    for (const form of this.formularios || []) {
      for (const a of form.acciones || []) {
        const mappedFormNombre =
          formularioNameMapping[form.nombre] || form.nombre;
        const accionCompleta = `${mappedFormNombre}.${a.nombre}`;
        if (
          accionCompleta.toLowerCase() === nombreAccion.toLowerCase() ||
          a.nombre.toLowerCase() === nombreAccion.toLowerCase() ||
          nombreAccion.toLowerCase().endsWith(`.${a.nombre.toLowerCase()}`)
        ) {
          return true;
        }
      }
    }

    if (!this.gruposPadres || this.gruposPadres.length === 0) return false;
    return this.gruposPadres.some((g) => g.tieneAccion(nombreAccion));
  }

  // ← Obtiene todas las acciones (recursivo) desde formularios
  obtenerAcciones(): string[] {
    const acciones = new Set<string>();
    const formularioNameMapping: Record<string, string> = {
      'Gestionar Productos': 'Productos',
      'Gestionar Categorias': 'Categorias',
      'Gestionar Mesas': 'Mesas',
      'Gestionar Pedidos': 'Pedidos',
      'Visualizar Reportes': 'Reportes',
      'Gestionar Usuarios': 'Usuarios',
      'Gestionar Grupos': 'Grupos',
      'Gestionar Modulos': 'Modulos',
      'Gestionar Formularios': 'Formularios',
      'Ver Acciones': 'Acciones',
    };

    for (const form of this.formularios || []) {
      const mappedFormNombre =
        formularioNameMapping[form.nombre] || form.nombre;
      for (const a of form.acciones || []) {
        acciones.add(`${mappedFormNombre}.${a.nombre}`);
      }
    }

    this.gruposPadres?.forEach((grupo) => {
      grupo.obtenerAcciones().forEach((a) => acciones.add(a));
    });

    return Array.from(acciones);
  }
}
