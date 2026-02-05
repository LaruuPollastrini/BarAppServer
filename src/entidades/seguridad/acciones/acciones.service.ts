import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Accion } from './acciones.entity';
import { Formulario } from '../formulario/formulario.entity';
import { Modulo } from '../modulo/modulo.entity';
import { Grupo } from '../grupos/grupos.entity';
import { AccionResponseDto, UpdateAccionDto } from './acciones.dto';

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
      formularios: accion.formularios?.map((f) => ({
        id: f.id,
        nombre: f.nombre,
      })),
    };
  }

  async findAll(): Promise<AccionResponseDto[]> {
    const acciones = await this.accionRepository.find({
      relations: ['formularios'],
    });
    return acciones.map((accion) => this.transformToResponseDto(accion));
  }

  async findOne(id: number): Promise<AccionResponseDto> {
    const accion = await this.accionRepository.findOne({
      where: { id },
      relations: ['formularios'],
    });

    if (!accion) {
      throw new NotFoundException(`Accion with ID ${id} not found`);
    }

    return this.transformToResponseDto(accion);
  }

  async update(id: number, dto: UpdateAccionDto): Promise<AccionResponseDto> {
    const accion = await this.accionRepository.findOne({
      where: { id },
      relations: ['formularios'],
    });
    if (!accion) {
      throw new NotFoundException(`Accion with ID ${id} not found`);
    }
    if (dto.nombre !== undefined) accion.nombre = dto.nombre;
    if (dto.formulariosIds !== undefined) {
      const formularios = await this.formularioRepository.find({
        where: { id: In(dto.formulariosIds) },
      });
      accion.formularios = formularios;
    }
    await this.accionRepository.save(accion);
    return this.findOne(id);
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
      Productos: 'Gestionar Productos',
      Categorias: 'Gestionar Categorias',
      Mesas: 'Gestionar Mesas',
      Pedidos: 'Gestionar Pedidos',
      Reportes: 'Visualizar Reportes',
      Usuarios: 'Gestionar Usuarios',
      Grupos: 'Gestionar Grupos',
      Modulos: 'Gestionar Modulos',
      Formularios: 'Gestionar Formularios',
      Acciones: 'Ver Acciones',
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

    let accion = await this.accionRepository.findOne({
      where: { nombre: accionNombre },
      relations: ['formularios'],
    });

    if (!accion) {
      accion = this.accionRepository.create({
        nombre: accionNombre,
        formularios: [formulario],
      });
      accion = await this.accionRepository.save(accion);
    } else if (
      accion.formularios &&
      !accion.formularios.some((f) => f.id === formulario.id)
    ) {
      accion.formularios = [...accion.formularios, formulario];
      await this.accionRepository.save(accion);
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
    const allAcciones = await this.accionRepository.find({
      relations: ['formularios', 'formularios.modulo'],
    });

    for (const accion of allAcciones) {
      for (const form of accion.formularios || []) {
        if (!form.modulo) {
          const moduloNombre = this.getModuloNameForFormulario(form.nombre);
          const modulo = await this.ensureModuloExists(moduloNombre);
          form.modulo = modulo;
          await this.formularioRepository.save(form);
        }
      }
    }

    console.log(
      `✅ Actions synchronized from database (${allAcciones.length} actions found)`,
    );
  }

  /**
   * Get all predefined actions available in the system
   * Now reads from database instead of constants
   */
  async getPredefinedActions(): Promise<Array<{ key: string; label: string }>> {
    const allAcciones = await this.accionRepository.find({
      relations: ['formularios'],
    });

    const result: Array<{ key: string; label: string }> = [];
    for (const accion of allAcciones) {
      const forms = accion.formularios || [];
      if (forms.length === 0) {
        result.push({ key: `unknown.${accion.nombre}`, label: accion.nombre });
      } else {
        for (const form of forms) {
          const oldFormNombre = this.mapFormularioNameToOld(form.nombre);
          result.push({
            key: `${oldFormNombre}.${accion.nombre}`,
            label: accion.nombre,
          });
        }
      }
    }
    return result;
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
          const moduloNombre = this.getModuloNameForFormulario(
            formulario.nombre,
          );
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
      formularios: string[];
      key: string;
    }>;
  }> {
    const allAcciones = await this.accionRepository.find({
      relations: ['formularios'],
    });

    return {
      totalInDb: allAcciones.length,
      acciones: allAcciones.map((accion) => {
        const forms = accion.formularios || [];
        const formulariosNames = forms.map((f) => f.nombre);
        const firstForm = forms[0];
        const oldFormNombre = firstForm
          ? this.mapFormularioNameToOld(firstForm.nombre)
          : 'unknown';
        const key =
          forms.length > 0
            ? `${oldFormNombre}.${accion.nombre}`
            : `unknown.${accion.nombre}`;
        return {
          id: accion.id,
          nombre: accion.nombre,
          formularios: formulariosNames.length > 0 ? formulariosNames : ['N/A'],
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
      accionId: number;
      formularios: Array<{ id: number; nombre: string }>;
      grupos: Array<{ id: number; nombre: string }>;
      existsInDb: boolean;
      dbId?: number;
    }>
  > {
    const allAcciones = await this.accionRepository.find({
      relations: ['formularios'],
    });

    const result: Array<{
      key: string;
      label: string;
      formulario: string;
      accionNombre: string;
      accionId: number;
      formularios: Array<{ id: number; nombre: string }>;
      grupos: Array<{ id: number; nombre: string }>;
      existsInDb: boolean;
      dbId?: number;
    }> = [];

    for (const accion of allAcciones) {
      const forms = accion.formularios || [];
      if (forms.length === 0) {
        result.push({
          key: `unknown.${accion.nombre}`,
          label: accion.nombre,
          formulario: 'unknown',
          accionNombre: accion.nombre,
          accionId: accion.id,
          formularios: [],
          grupos: [],
          existsInDb: true,
          dbId: accion.id,
        });
      } else {
        for (const form of forms) {
          const oldFormNombre = this.mapFormularioNameToOld(form.nombre);
          result.push({
            key: `${oldFormNombre}.${accion.nombre}`,
            label: accion.nombre,
            formulario: oldFormNombre,
            accionNombre: accion.nombre,
            accionId: accion.id,
            formularios: forms.map((f) => ({ id: f.id, nombre: f.nombre })),
            grupos: [],
            existsInDb: true,
            dbId: accion.id,
          });
        }
      }
    }
    return result;
  }
}
