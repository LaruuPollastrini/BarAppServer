import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Grupo } from './grupos.entity';
import { Formulario } from '../formulario/formulario.entity';
import { CreateGrupoDto, UpdateGrupoDto, GrupoResponseDto } from './grupos.dto';

/** Nombre normalizado del grupo Admin (no se puede modificar/eliminar; solo lectura para quienes pertenecen) */
const NOMBRE_GRUPO_ADMIN = 'admin';

/** Formularios del módulo Seguridad: el grupo Admin no puede perder estos formularios */
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
    @InjectRepository(Formulario)
    private formularioRepository: Repository<Formulario>,
  ) {}

  private transformToResponseDto(grupo: Grupo): GrupoResponseDto {
    return {
      id: grupo.id,
      nombre: grupo.nombre,
      estaActivo: grupo.estaActivo,
      formularios: grupo.formularios?.map((f) => ({
        id: f.id,
        nombre: f.nombre,
      })),
    };
  }

  async findAll(user: RequestUser): Promise<GrupoResponseDto[]> {
    const grupos = await this.grupoRepository.find({
      relations: ['formularios'],
    });
    const dtos = grupos.map((grupo) => this.transformToResponseDto(grupo));
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
      relations: ['formularios'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

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

    if (
      createGrupoDto.formulariosIds &&
      createGrupoDto.formulariosIds.length > 0
    ) {
      const formularios = await this.ensureFormulariosExist(
        createGrupoDto.formulariosIds,
      );
      savedGrupo.formularios = formularios;
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
      relations: ['formularios'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }

    if (isAdminGroup(grupo)) {
      throw new ForbiddenException('No se puede modificar el grupo Admin.');
    }

    grupo.nombre = updateGrupoDto.nombre;
    if (updateGrupoDto.estaActivo !== undefined) {
      grupo.estaActivo = updateGrupoDto.estaActivo;
    }

    if (updateGrupoDto.formulariosIds !== undefined) {
      let finalFormulariosIds = [...updateGrupoDto.formulariosIds];
      const isAdmin = grupo.nombre?.trim().toLowerCase() === 'admin';
      if (isAdmin) {
        const securityFormularioIds = (grupo.formularios || [])
          .filter((f) => FORMULARIOS_SEGURIDAD.includes(f.nombre))
          .map((f) => f.id);
        finalFormulariosIds = [
          ...new Set([...finalFormulariosIds, ...securityFormularioIds]),
        ];
      }
      const formularios =
        await this.ensureFormulariosExist(finalFormulariosIds);
      grupo.formularios = formularios;
    }

    await this.grupoRepository.save(grupo);
    return this.findOne(id, user);
  }

  async remove(id: number): Promise<void> {
    const grupo = await this.grupoRepository.findOne({
      where: { id },
      relations: ['formularios'],
    });
    if (!grupo) {
      throw new NotFoundException(`Grupo with ID ${id} not found`);
    }
    if (isAdminGroup(grupo)) {
      throw new ForbiddenException('No se puede eliminar el grupo Admin.');
    }
    await this.grupoRepository.delete(id);
  }

  /**
   * Asigna todos los formularios al grupo por nombre (ej. Admin = todos los privilegios).
   */
  async assignAllFormulariosToGrupo(
    grupoNombre: string,
  ): Promise<GrupoResponseDto> {
    const grupo = await this.grupoRepository.findOne({
      where: { nombre: grupoNombre },
      relations: ['formularios'],
    });

    if (!grupo) {
      throw new NotFoundException(`Grupo "${grupoNombre}" no encontrado`);
    }

    const allFormularios = await this.formularioRepository.find();
    grupo.formularios = allFormularios;
    await this.grupoRepository.save(grupo);

    return this.findOne(grupo.id);
  }

  private async ensureFormulariosExist(
    formulariosIds: number[],
  ): Promise<Formulario[]> {
    return this.formularioRepository.find({
      where: { id: In(formulariosIds) },
    });
  }
}
