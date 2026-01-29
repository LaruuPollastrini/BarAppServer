import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/users.entity';
import { Grupo } from './grupos/grupos.entity';
import { Modulo } from './modulo/modulo.entity';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Grupo)
    private grupoRepo: Repository<Grupo>,
    @InjectRepository(Modulo)
    private moduloRepo: Repository<Modulo>,
  ) {}

  async obtenerUsuario(userId: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'grupos',
        'grupos.acciones',
        'grupos.acciones.formulario',
        'grupos.acciones.formulario.modulo',
        'grupos.gruposPadres',
        'grupos.gruposPadres.acciones',
        'grupos.gruposPadres.acciones.formulario',
        'grupos.gruposPadres.acciones.formulario.modulo',
      ],
    });
  }

  async usuarioPuedeHacer(userId: number, accion: string): Promise<boolean> {
    const usuario = await this.obtenerUsuario(userId);
    return usuario?.tieneAccion(accion) || false;
  }

  async usuarioPuedeAccederModulo(
    userId: number,
    moduloNombre: string,
  ): Promise<boolean> {
    const usuario = await this.obtenerUsuario(userId);
    if (!usuario || !usuario.grupos) return false;

    // Check if user has any action that belongs to a form that belongs to the modulo
    for (const grupo of usuario.grupos) {
      if (grupo.acciones) {
        for (const accion of grupo.acciones) {
          if (
            accion.formulario?.modulo?.nombre.toLowerCase() ===
            moduloNombre.toLowerCase()
          ) {
            return true;
          }
        }
      }
      // Check parent groups recursively
      if (grupo.gruposPadres) {
        for (const grupoPadre of grupo.gruposPadres) {
          if (grupoPadre.acciones) {
            for (const accion of grupoPadre.acciones) {
              if (
                accion.formulario?.modulo?.nombre.toLowerCase() ===
                moduloNombre.toLowerCase()
              ) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  async obtenerModulosAccesibles(userId: number): Promise<string[]> {
    const usuario = await this.obtenerUsuario(userId);
    if (!usuario || !usuario.grupos) {
      console.log(`[obtenerModulosAccesibles] Usuario ${userId} no tiene grupos`);
      return [];
    }

    const modulosSet = new Set<string>();

    for (const grupo of usuario.grupos) {
      if (grupo.acciones) {
        for (const accion of grupo.acciones) {
          if (accion.formulario?.modulo?.nombre) {
            const moduloNombre = accion.formulario.modulo.nombre;
            modulosSet.add(moduloNombre);
            console.log(`[obtenerModulosAccesibles] Grupo "${grupo.nombre}" tiene acción "${accion.nombre}" → formulario "${accion.formulario.nombre}" → módulo "${moduloNombre}"`);
          } else {
            console.warn(`[obtenerModulosAccesibles] Acción "${accion.nombre}" (ID: ${accion.id}) no tiene formulario.modulo vinculado`);
          }
        }
      } else {
        console.log(`[obtenerModulosAccesibles] Grupo "${grupo.nombre}" no tiene acciones`);
      }
      // Check parent groups recursively
      if (grupo.gruposPadres) {
        for (const grupoPadre of grupo.gruposPadres) {
          if (grupoPadre.acciones) {
            for (const accion of grupoPadre.acciones) {
              if (accion.formulario?.modulo?.nombre) {
                const moduloNombre = accion.formulario.modulo.nombre;
                modulosSet.add(moduloNombre);
              }
            }
          }
        }
      }
    }

    const modulosArray = Array.from(modulosSet);
    console.log(`[obtenerModulosAccesibles] Usuario ${userId} tiene acceso a módulos:`, modulosArray);
    return modulosArray;
  }

  async obtenerAccionesAccesibles(userId: number): Promise<string[]> {
    const usuario = await this.obtenerUsuario(userId);
    if (!usuario) {
      console.log(`[obtenerAccionesAccesibles] Usuario ${userId} no encontrado`);
      return [];
    }
    
    if (!usuario.grupos || usuario.grupos.length === 0) {
      console.log(`[obtenerAccionesAccesibles] Usuario ${userId} no tiene grupos`);
      return [];
    }
    
    console.log(`[obtenerAccionesAccesibles] Usuario ${userId} tiene ${usuario.grupos.length} grupo(s)`);
    for (const grupo of usuario.grupos) {
      console.log(`[obtenerAccionesAccesibles] Grupo "${grupo.nombre}" tiene ${grupo.acciones?.length || 0} acción(es)`);
      if (grupo.acciones && grupo.acciones.length > 0) {
        grupo.acciones.forEach((accion) => {
          console.log(`[obtenerAccionesAccesibles] - Acción: "${accion.nombre}", Formulario: "${accion.formulario?.nombre || 'N/A'}"`);
        });
      }
    }
    
    const acciones = usuario.obtenerAcciones();
    console.log(`[obtenerAccionesAccesibles] Usuario ${userId} tiene ${acciones.length} acciones accesibles:`, acciones);
    return acciones;
  }

  async agregarGrupoAGrupo(
    grupoHijoId: number,
    grupoPadreId: number,
  ): Promise<Grupo> {
    const hijo = await this.grupoRepo.findOne({
      where: { id: grupoHijoId },
      relations: ['gruposPadres'],
    });
    if (!hijo?.gruposPadres) throw new Error('Grupo hijo no encontrado');
    const padre = await this.grupoRepo.findOne({ where: { id: grupoPadreId } });
    if (!padre) throw new Error('Grupo padre no encontrado');
    hijo.gruposPadres = [...(hijo.gruposPadres || []), padre];
    return this.grupoRepo.save(hijo);
  }

  /**
   * Debug endpoint to check user permissions
   * Returns detailed information about user's grupos, acciones, and modulos
   */
  async debugUserPermissions(userId: number): Promise<{
    userId: number;
    grupos: Array<{
      id: number;
      nombre: string;
      accionesCount: number;
      acciones: Array<{
        id: number;
        nombre: string;
        formulario: string | null;
        modulo: string | null;
        hasModulo: boolean;
      }>;
    }>;
    modulosAccesibles: string[];
    accionesAccesibles: string[];
    issues: Array<{
      type: 'missing_modulo' | 'missing_formulario' | 'orphan_accion';
      message: string;
      accionId?: number;
      accionNombre?: string;
      formularioNombre?: string;
    }>;
  }> {
    const usuario = await this.obtenerUsuario(userId);
    if (!usuario) {
      return {
        userId,
        grupos: [],
        modulosAccesibles: [],
        accionesAccesibles: [],
        issues: [{ type: 'orphan_accion', message: 'Usuario no encontrado' }],
      };
    }

    const modulosAccesibles = await this.obtenerModulosAccesibles(userId);
    const accionesAccesibles = await this.obtenerAccionesAccesibles(userId);
    const issues: Array<{
      type: 'missing_modulo' | 'missing_formulario' | 'orphan_accion';
      message: string;
      accionId?: number;
      accionNombre?: string;
      formularioNombre?: string;
    }> = [];

    const gruposDebug = usuario.grupos?.map((grupo) => {
      const accionesDebug = grupo.acciones?.map((accion) => {
        const formularioNombre = accion.formulario?.nombre || null;
        const moduloNombre = accion.formulario?.modulo?.nombre || null;
        const hasModulo = !!moduloNombre;

        // Check for issues
        if (!accion.formulario) {
          issues.push({
            type: 'missing_formulario',
            message: `Acción "${accion.nombre}" (ID: ${accion.id}) no tiene formulario asignado`,
            accionId: accion.id,
            accionNombre: accion.nombre,
          });
        } else if (!accion.formulario.modulo) {
          issues.push({
            type: 'missing_modulo',
            message: `Formulario "${formularioNombre}" no tiene módulo asignado (Acción: "${accion.nombre}", ID: ${accion.id})`,
            accionId: accion.id,
            accionNombre: accion.nombre,
            formularioNombre: formularioNombre || undefined,
          });
        }

        return {
          id: accion.id,
          nombre: accion.nombre,
          formulario: formularioNombre,
          modulo: moduloNombre,
          hasModulo,
        };
      }) || [];

      return {
        id: grupo.id,
        nombre: grupo.nombre,
        accionesCount: accionesDebug.length,
        acciones: accionesDebug,
      };
    }) || [];

    return {
      userId,
      grupos: gruposDebug,
      modulosAccesibles,
      accionesAccesibles,
      issues,
    };
  }
}
