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
        'grupos.formularios',
        'grupos.formularios.acciones',
        'grupos.formularios.modulo',
        'grupos.gruposPadres',
        'grupos.gruposPadres.formularios',
        'grupos.gruposPadres.formularios.acciones',
        'grupos.gruposPadres.formularios.modulo',
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

    for (const grupo of usuario.grupos) {
      if (grupo.formularios) {
        for (const form of grupo.formularios) {
          if (
            form.modulo?.nombre?.toLowerCase() === moduloNombre.toLowerCase()
          ) {
            return true;
          }
        }
      }
      if (grupo.gruposPadres) {
        for (const grupoPadre of grupo.gruposPadres) {
          if (grupoPadre.formularios) {
            for (const form of grupoPadre.formularios) {
              if (
                form.modulo?.nombre?.toLowerCase() ===
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
      console.log(
        `[obtenerModulosAccesibles] Usuario ${userId} no tiene grupos`,
      );
      return [];
    }

    const modulosSet = new Set<string>();

    for (const grupo of usuario.grupos) {
      if (grupo.formularios) {
        for (const form of grupo.formularios) {
          if (form.modulo?.nombre) {
            modulosSet.add(form.modulo.nombre);
            console.log(
              `[obtenerModulosAccesibles] Grupo "${grupo.nombre}" → formulario "${form.nombre}" → módulo "${form.modulo.nombre}"`,
            );
          }
        }
      }
      if (grupo.gruposPadres) {
        for (const grupoPadre of grupo.gruposPadres) {
          if (grupoPadre.formularios) {
            for (const form of grupoPadre.formularios) {
              if (form.modulo?.nombre) modulosSet.add(form.modulo.nombre);
            }
          }
        }
      }
    }

    const modulosArray = Array.from(modulosSet);
    console.log(
      `[obtenerModulosAccesibles] Usuario ${userId} tiene acceso a módulos:`,
      modulosArray,
    );
    return modulosArray;
  }

  async obtenerAccionesAccesibles(userId: number): Promise<string[]> {
    const usuario = await this.obtenerUsuario(userId);
    if (!usuario) {
      console.log(
        `[obtenerAccionesAccesibles] Usuario ${userId} no encontrado`,
      );
      return [];
    }
    if (!usuario.grupos || usuario.grupos.length === 0) {
      console.log(
        `[obtenerAccionesAccesibles] Usuario ${userId} no tiene grupos`,
      );
      return [];
    }
    console.log(
      `[obtenerAccionesAccesibles] Usuario ${userId} tiene ${usuario.grupos.length} grupo(s)`,
    );
    for (const grupo of usuario.grupos) {
      const totalAcciones =
        grupo.formularios?.reduce((n, f) => n + (f.acciones?.length || 0), 0) ??
        0;
      console.log(
        `[obtenerAccionesAccesibles] Grupo "${grupo.nombre}" tiene ${grupo.formularios?.length ?? 0} formulario(s) y ${totalAcciones} acción(es)`,
      );
    }
    const acciones = usuario.obtenerAcciones();
    console.log(
      `[obtenerAccionesAccesibles] Usuario ${userId} tiene ${acciones.length} acciones accesibles:`,
      acciones,
    );
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
    if (!hijo) throw new Error('Grupo hijo no encontrado');
    const padre = await this.grupoRepo.findOne({ where: { id: grupoPadreId } });
    if (!padre) throw new Error('Grupo padre no encontrado');
    hijo.gruposPadres = [...(hijo.gruposPadres || []), padre];
    return this.grupoRepo.save(hijo);
  }

  /**
   * Debug endpoint to check user permissions
   * Returns detailed information about user's grupos, formularios, acciones, and modulos
   */
  async debugUserPermissions(userId: number): Promise<{
    userId: number;
    grupos: Array<{
      id: number;
      nombre: string;
      formulariosCount: number;
      formularios: Array<{
        id: number;
        nombre: string;
        modulo: string | null;
        accionesCount: number;
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

    const gruposDebug =
      usuario.grupos?.map((grupo) => {
        const formulariosDebug = (grupo.formularios || []).map((form) => {
          if (!form.modulo) {
            issues.push({
              type: 'missing_modulo',
              message: `Formulario "${form.nombre}" (ID: ${form.id}) no tiene módulo asignado`,
              formularioNombre: form.nombre,
            });
          }
          return {
            id: form.id,
            nombre: form.nombre,
            modulo: form.modulo?.nombre ?? null,
            accionesCount: form.acciones?.length ?? 0,
          };
        });

        return {
          id: grupo.id,
          nombre: grupo.nombre,
          formulariosCount: formulariosDebug.length,
          formularios: formulariosDebug,
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
