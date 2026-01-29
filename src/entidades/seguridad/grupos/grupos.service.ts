import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grupo } from './grupos.entity';
import { Accion } from '../acciones/acciones.entity';
import { AccionesService } from '../acciones/acciones.service';
import { CreateGrupoDto, UpdateGrupoDto, GrupoResponseDto } from './grupos.dto';

/** Nombre normalizado del grupo Admin (no se puede modificar/eliminar; solo lectura para quienes pertenecen) */
const NOMBRE_GRUPO_ADMIN = 'admin';

/** Formularios del módulo Seguridad: el grupo Admin no puede perder estas acciones */
const FORMULARIOS_SEGURIDAD = [
  'Gestionar Modulos',
  'Gestionar Grupos',
  'Gestionar Formularios',
  'Ver Acciones',
  'Gestionar Usuarios',
];

/** Usuario mínimo para reglas del grupo Admin (evita importar User y ciclos) */
export type RequestUser = { grupos?: { nombre: string }[] };

function isUserInAdminGroup(user: RequestUser | null): boolean {
  if (!user?.grupos?.length) return false;
  return user.grupos.some(
    (g) => g.nombre?.trim().toLowerCase() === NOMBRE_GRUPO_ADMIN,
  );
}

function isAdminGroup(grupo: Grupo): boolean {
  return grupo.nombre?.trim().toLowerCase() === NOMBRE_GRUPO_ADMIN;
}

@Injectable()
export class GruposService {
  constructor(
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
    @InjectRepository(Accion)
    private accionRepository: Repository<Accion>,
    private accionesService: AccionesService,
  ) {}

  private transformToResponseDto(grupo: Grupo): GrupoResponseDto {
    return {
      id: grupo.id,
      nombre: grupo.nombre,
      estaActivo: grupo.estaActivo,
      acciones: grupo.acciones?.map((accion) => ({
        id: accion.id,
        nombre: accion.nombre,
        formulario: accion.formulario
          ? {
              id: accion.formulario.id,
              nombre: accion.formulario.nombre,
            }
          : undefined,
      })),
    };
  }

  async findAll(user: RequestUser): Promise<GrupoResponseDto[]> {
    const grupos = await this.grupoRepository.find({
      relations: ['acciones', 'acciones.formulario'],
    });
    const dtos = grupos.map((grupo) => this.transformToResponseDto(grupo));
    // Los usuarios que no pertenecen al grupo Admin no pueden ver el grupo Admin
    if (!isUserInAdminGroup(user)) {
      return dtos.filter(
        (g) => g.nombre?.trim().toLowerCase() !== NOMBRE_GRUPO_ADMIN,
      );
    }
    return dtos;
  }

  async findOne(id: number, user?: RequestUser): Promise<GrupoResponseDto> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones', 'acciones.formulario'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    // Si es el grupo Admin y el usuario no pertenece a Admin, no puede verlo (user undefined = llamada interna, permitir)
    if (
      user !== undefined &&
      isAdminGroup(grupo) &&
      !isUserInAdminGroup(user)
    ) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    return this.transformToResponseDto(grupo);
  }

  async create(createGrupoDto: CreateGrupoDto): Promise<GrupoResponseDto> {
    const grupo = this.grupoRepository.create({
      nombre: createGrupoDto.nombre,
      estaActivo:
        createGrupoDto.estaActivo !== undefined
          ? createGrupoDto.estaActivo
          : true,
    });

    const savedGrupo = await this.grupoRepository.save(grupo);

    if (createGrupoDto.accionesIds && createGrupoDto.accionesIds.length > 0) {
      // Ensure all predefined actions exist in DB before assigning
      const acciones = await this.ensurePredefinedActionsExist(
        createGrupoDto.accionesIds,
      );
      savedGrupo.acciones = acciones;
      const updatedGrupo = await this.grupoRepository.save(savedGrupo);
      return this.findOne(updatedGrupo.id);
    }

    return this.findOne(savedGrupo.id);
  }

  async update(
    id: number,
    updateGrupoDto: UpdateGrupoDto,
    user: RequestUser,
  ): Promise<GrupoResponseDto> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones', 'acciones.formulario'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    // Nadie puede modificar el grupo Admin
    if (isAdminGroup(grupo)) {
      throw new ForbiddenException('No se puede modificar el grupo Admin.');
    }

    grupo.nombre = updateGrupoDto.nombre;
    if (updateGrupoDto.estaActivo !== undefined) {
      grupo.estaActivo = updateGrupoDto.estaActivo;
    }

    if (updateGrupoDto.accionesIds !== undefined) {
      let finalAccionesIds = [...updateGrupoDto.accionesIds];
      const isAdmin = grupo.nombre?.trim().toLowerCase() === 'admin';
      if (isAdmin) {
        const securityActionIds = (grupo.acciones || [])
          .filter(
            (a) =>
              a.formulario?.nombre &&
              FORMULARIOS_SEGURIDAD.includes(a.formulario.nombre),
          )
          .map((a) => a.id);
        finalAccionesIds = [
          ...new Set([...finalAccionesIds, ...securityActionIds]),
        ];
      }
      const acciones =
        await this.ensurePredefinedActionsExist(finalAccionesIds);
      grupo.acciones = acciones;
    }

    await this.grupoRepository.save(grupo);
    return this.findOne(id, user);
  }

  async remove(id: number): Promise<void> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['acciones', 'acciones.formulario'],
    });
    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }
    // Nadie puede eliminar el grupo Admin
    if (isAdminGroup(grupo)) {
      throw new ForbiddenException('No se puede eliminar el grupo Admin.');
    }
    await this.grupoRepository.delete(id);
  }

  /**
   * Assign all actions from database to a grupo by name
   * This gives the grupo full access to all system actions
   * Actions are now seeded via SQL, so we get them from DB
   */
  async assignAllPredefinedActionsToGrupo(
    grupoNombre: string,
  ): Promise<GrupoResponseDto> {
    // Find the grupo by name
    const grupo = await this.grupoRepository.findOne({
      where: { nombre: grupoNombre },
      relations: ['acciones'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo "${grupoNombre}" no encontrado`);
    }

    // Get all actions from database (seeded via SQL)
    const allAcciones = await this.accionRepository.find({
      relations: ['formulario'],
    });

    // Assign all actions to the grupo
    grupo.acciones = allAcciones;
    await this.grupoRepository.save(grupo);

    return this.findOne(grupo.id);
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
   * Ensure actions exist in DB before assigning to groups
   * Now accepts any action from DB (actions are seeded via SQL)
   */
  private async ensurePredefinedActionsExist(
    accionesIds: number[],
  ): Promise<Accion[]> {
    // Get all actions by IDs
    const acciones = await this.accionRepository.find({
      where: { id: In(accionesIds) },
      relations: ['formulario'],
    });

    // Return all valid actions (those with formulario)
    // Actions are now managed via SQL seed, so we accept any action that exists in DB
    const validAcciones: Accion[] = [];
    for (const accion of acciones) {
      if (!accion.formulario) {
        console.warn(
          `Skipping action ${accion.id} (${accion.nombre}) - no formulario`,
        );
        continue; // Skip actions without formulario
      }

      // Action exists and has formulario, it's valid
      validAcciones.push(accion);
    }

    return validAcciones;
  }
}
