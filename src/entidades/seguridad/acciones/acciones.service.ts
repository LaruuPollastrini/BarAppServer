import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accion } from './acciones.entity';
import { Formulario } from '../formulario/formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { Grupo } from '../grupos/grupos.entity';
import { AccionResponseDto } from './acciones.dto';

@Injectable()
export class AccionesService {
  constructor(
    @InjectRepository(Accion)
    private accionRepository: Repository<Accion>,
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
  ) {}

  private transformToResponseDto(accion: Accion): AccionResponseDto {
    return {
      id: accion.id,
      nombre: accion.nombre,
      formulario: accion.formulario
        ? {
            id: accion.formulario.id,
            nombre: accion.formulario.nombre,
          }
        : undefined,
    };
  }

  async findAll(): Promise<AccionResponseDto[]> {
    const acciones = await this.accionRepository.find({
      relations: ['formulario', 'grupos'],
    });
    return acciones.map((accion) => this.transformToResponseDto(accion));
  }

  async findOne(id: number): Promise<AccionResponseDto> {
    const accion = await this.accionRepository.findOne({
      where: { id },
      relations: ['formulario', 'grupos'],
    });

    if (!accion) {
      throw new NotFoundException(`Accion with ID ${id} not found`);
    }

    return this.transformToResponseDto(accion);
  }

  /**
   * Ensure a modulo exists, create it if it doesn't
   */
  private async ensureModuloExists(moduloNombre: string): Promise<Modulo> {
    let modulo = await this.moduloRepository.findOne({
      where: { nombre: moduloNombre },
    });

    if (!modulo) {
      modulo = this.moduloRepository.create({ nombre: moduloNombre });
      modulo = await this.moduloRepository.save(modulo);
      console.log(`Created modulo: ${moduloNombre}`);
    }

    return modulo;
  }

  /**
   * Get the module name for a formulario based on its name
   * Maps both old names (from constants) and new names (from DB) to modules
   */
  private getModuloNameForFormulario(formularioNombre: string): string {
    // Map formularios to their modules
    // Supports both old names (from constants) and new names (from DB)
    const formularioToModulo: Record<string, string> = {
      // Old names (from constants) - map to individual modules
      Productos: 'Productos',
      Categorias: 'Categorias',
      Mesas: 'Mesas',
      Pedidos: 'Pedidos',
      // New names (from DB) - map to individual modules
      'Gestionar Productos': 'Productos',
      'Gestionar Categorias': 'Categorias',
      'Gestionar Mesas': 'Mesas',
      'Gestionar Pedidos': 'Pedidos',
      // Reportes module
      Reportes: 'Reportes',
      'Visualizar Reportes': 'Reportes',
      // Seguridad module (default)
      Usuarios: 'Seguridad',
      Grupos: 'Seguridad',
      Modulos: 'Seguridad',
      Formularios: 'Seguridad',
      Acciones: 'Seguridad',
      // New names (from DB) - Seguridad module
      'Gestionar Usuarios': 'Seguridad',
      'Gestionar Grupos': 'Seguridad',
      'Gestionar Modulos': 'Seguridad',
      'Gestionar Formularios': 'Seguridad',
      'Ver Acciones': 'Seguridad',
    };

    return formularioToModulo[formularioNombre] || 'Seguridad';
  }

  /**
   * Map old formulario names (from constants) to new names (in DB)
   */
  private mapFormularioNameToDb(formularioNombre: string): string {
    const nameMapping: Record<string, string> = {
      'Productos': 'Gestionar Productos',
      'Categorias': 'Gestionar Categorias',
      'Mesas': 'Gestionar Mesas',
      'Pedidos': 'Gestionar Pedidos',
      'Reportes': 'Visualizar Reportes',
      'Usuarios': 'Gestionar Usuarios',
      'Grupos': 'Gestionar Grupos',
      'Modulos': 'Gestionar Modulos',
      'Formularios': 'Gestionar Formularios',
      'Acciones': 'Ver Acciones',
    };
    return nameMapping[formularioNombre] || formularioNombre;
  }

  /**
   * Ensure a formulario exists, create it if it doesn't
   */
  private async ensureFormularioExists(
    formularioNombre: string,
  ): Promise<Formulario> {
    // Map old name to new name if needed
    const dbFormularioNombre = this.mapFormularioNameToDb(formularioNombre);
    
    let formulario = await this.formularioRepository.findOne({
      where: { nombre: dbFormularioNombre },
      relations: ['modulo'],
    });

    if (!formulario) {
      // Determine the module for this formulario (use original name for mapping)
      const moduloNombre = this.getModuloNameForFormulario(formularioNombre);

      // Ensure the modulo exists first
      const modulo = await this.ensureModuloExists(moduloNombre);

      formulario = this.formularioRepository.create({
        nombre: dbFormularioNombre,
        modulo: modulo,
      });
      formulario = await this.formularioRepository.save(formulario);
      console.log(
        `Created formulario: ${dbFormularioNombre} (modulo: ${moduloNombre})`,
      );
    }

    return formulario;
  }

  /**
   * Ensure an action exists in the database
   * Now reads from DB instead of constants - actions are seeded via SQL
   */
  async ensurePredefinedActionExists(
    formularioNombre: string,
    accionNombre: string,
  ): Promise<Accion> {
    // Map old formulario name to new DB name
    const dbFormularioNombre = this.mapFormularioNameToDb(formularioNombre);
    
    // Ensure the formulario exists (will create it if it doesn't)
    const formulario = await this.ensureFormularioExists(dbFormularioNombre);

    // Check if action already exists
    let accion = await this.accionRepository.findOne({
      where: {
        nombre: accionNombre,
        formulario: { id: formulario.id },
      },
      relations: ['formulario'],
    });

    // If it doesn't exist, create it (this allows actions to be added via SQL seed)
    if (!accion) {
      accion = this.accionRepository.create({
        nombre: accionNombre,
        formulario: formulario,
      });
      accion = await this.accionRepository.save(accion);
    }

    return accion;
  }

  /**
   * Map new formulario names to old names (for predefined actions lookup)
   */
  private mapFormularioNameToOld(formularioNombre: string): string {
    const nameMapping: Record<string, string> = {
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
    return nameMapping[formularioNombre] || formularioNombre;
  }

  /**
   * Get all actions from database (now actions are seeded via SQL, not constants)
   * This method is kept for backward compatibility but no longer validates against constants
   */
  async synchronizePredefinedActions(): Promise<void> {
    // Actions are now managed via SQL seed file
    // Just ensure formularios and modulos exist
    const allAcciones = await this.accionRepository.find({
      relations: ['formulario'],
    });

    for (const accion of allAcciones) {
      if (!accion.formulario) {
        console.warn(`Action "${accion.nombre}" (ID: ${accion.id}) has no formulario`);
        continue;
      }

      // Ensure formulario has modulo
      if (!accion.formulario.modulo) {
        const moduloNombre = this.getModuloNameForFormulario(accion.formulario.nombre);
        const modulo = await this.ensureModuloExists(moduloNombre);
        accion.formulario.modulo = modulo;
        await this.formularioRepository.save(accion.formulario);
      }
    }

    console.log(`✅ Actions synchronized from database (${allAcciones.length} actions found)`);
  }

  /**
   * Get all predefined actions available in the system
   * Now reads from database instead of constants
   */
  async getPredefinedActions(): Promise<Array<{ key: string; label: string }>> {
    const allAcciones = await this.accionRepository.find({
      relations: ['formulario'],
    });

    return allAcciones.map((accion) => {
      if (!accion.formulario) {
        return { key: `unknown.${accion.nombre}`, label: accion.nombre };
      }

      // Map new formulario name to old name for frontend compatibility
      const oldFormularioNombre = this.mapFormularioNameToOld(accion.formulario.nombre);
      const key = `${oldFormularioNombre}.${accion.nombre}`;
      
      return { key, label: accion.nombre };
    });
  }

  /**
   * Fix formularios that don't have modulo assigned
   * This ensures all formularios are properly linked to their modulos
   */
  async fixFormulariosModulos(): Promise<{
    fixed: number;
    errors: Array<{ formulario: string; error: string }>;
  }> {
    const allFormularios = await this.formularioRepository.find({
      relations: ['modulo'],
    });

    let fixed = 0;
    const errors: Array<{ formulario: string; error: string }> = [];

    for (const formulario of allFormularios) {
      // If formulario doesn't have modulo, fix it
      if (!formulario.modulo) {
        try {
          const moduloNombre = this.getModuloNameForFormulario(formulario.nombre);
          const modulo = await this.ensureModuloExists(moduloNombre);
          formulario.modulo = modulo;
          await this.formularioRepository.save(formulario);
          fixed++;
        } catch (error) {
          errors.push({
            formulario: formulario.nombre,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return { fixed, errors };
  }

  /**
   * Get all actions from database (actions are now seeded via SQL)
   * Returns all actions in DB with their details
   */
  async verifyAccionesMatch(): Promise<{
    totalInDb: number;
    acciones: Array<{
      id: number;
      nombre: string;
      formulario: string;
      modulo: string;
      key: string;
    }>;
  }> {
    const allAcciones = await this.accionRepository.find({
      relations: ['formulario', 'formulario.modulo'],
    });

    return {
      totalInDb: allAcciones.length,
      acciones: allAcciones.map((accion) => {
        if (!accion.formulario) {
          return {
            id: accion.id,
            nombre: accion.nombre,
            formulario: 'N/A',
            modulo: 'N/A',
            key: `unknown.${accion.nombre}`,
          };
        }

        const oldFormularioNombre = this.mapFormularioNameToOld(accion.formulario.nombre);
        const key = `${oldFormularioNombre}.${accion.nombre}`;

        return {
          id: accion.id,
          nombre: accion.nombre,
          formulario: accion.formulario.nombre,
          modulo: accion.formulario.modulo?.nombre || 'N/A',
          key,
        };
      }),
    };
  }

  /**
   * Get predefined actions with their assigned grupos
   * Now reads from database instead of constants
   */
  async getPredefinedActionsWithGrupos(): Promise<
    Array<{
      key: string;
      label: string;
      formulario: string;
      accionNombre: string;
      grupos: Array<{ id: number; nombre: string }>;
      existsInDb: boolean;
      dbId?: number;
    }>
  > {
    const allAcciones = await this.accionRepository.find({
      relations: ['formulario', 'grupos'],
    });

    return allAcciones.map((accion) => {
      if (!accion.formulario) {
        return {
          key: `unknown.${accion.nombre}`,
          label: accion.nombre,
          formulario: 'unknown',
          accionNombre: accion.nombre,
          grupos: accion.grupos?.map((g) => ({ id: g.id, nombre: g.nombre })) || [],
          existsInDb: true,
          dbId: accion.id,
        };
      }

      // Map new formulario name to old name for frontend compatibility
      const oldFormularioNombre = this.mapFormularioNameToOld(accion.formulario.nombre);
      const key = `${oldFormularioNombre}.${accion.nombre}`;

      return {
        key,
        label: accion.nombre,
        formulario: oldFormularioNombre,
        accionNombre: accion.nombre,
        grupos: accion.grupos?.map((g) => ({ id: g.id, nombre: g.nombre })) || [],
        existsInDb: true,
        dbId: accion.id,
      };
    });
  }
}
