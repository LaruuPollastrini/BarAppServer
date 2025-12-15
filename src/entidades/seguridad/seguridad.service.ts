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
    if (!usuario || !usuario.grupos) return [];

    const modulosSet = new Set<string>();

    for (const grupo of usuario.grupos) {
      if (grupo.acciones) {
        for (const accion of grupo.acciones) {
          if (accion.formulario?.modulo?.nombre) {
            modulosSet.add(accion.formulario.modulo.nombre);
          }
        }
      }
      // Check parent groups recursively
      if (grupo.gruposPadres) {
        for (const grupoPadre of grupo.gruposPadres) {
          if (grupoPadre.acciones) {
            for (const accion of grupoPadre.acciones) {
              if (accion.formulario?.modulo?.nombre) {
                modulosSet.add(accion.formulario.modulo.nombre);
              }
            }
          }
        }
      }
    }

    return Array.from(modulosSet);
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
}
