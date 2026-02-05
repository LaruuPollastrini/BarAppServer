import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { Grupo } from '../grupos/grupos.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './users.dto';

const NOMBRE_GRUPO_ADMIN = 'admin';

function isAdminGroup(grupo: Grupo): boolean {
  return grupo.nombre?.trim().toLowerCase() === NOMBRE_GRUPO_ADMIN;
}

function userHasAdminGroup(user: User): boolean {
  return user.grupos?.some(
    (g) => g.nombre?.trim().toLowerCase() === NOMBRE_GRUPO_ADMIN,
  )
    ? true
    : false;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Grupo)
    private grupoRepository: Repository<Grupo>,
  ) {}

  private transformToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      nombre: user.Nombre,
      apellido: user.Apellido,
      correo: user.Correo,
      telefono: user.Telefono,
      estaActivo: user.EstaActivo,
      grupos: user.grupos?.map((grupo) => ({
        id: grupo.id,
        nombre: grupo.nombre,
        estado: grupo.estaActivo,
      })),
    };
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      relations: ['grupos'],
      select: {
        id: true,
        Nombre: true,
        Apellido: true,
        Correo: true,
        Telefono: true,
        EstaActivo: true,
        grupos: {
          id: true,
          nombre: true,
          estaActivo: true,
        },
      },
    });

    return users.map((user) => this.transformToResponseDto(user));
  }

  async findOne(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['grupos'],
      select: {
        id: true,
        Nombre: true,
        Apellido: true,
        Correo: true,
        Telefono: true,
        EstaActivo: true,
        grupos: {
          id: true,
          nombre: true,
          estaActivo: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.transformToResponseDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.contrasena, 10);

    const user = this.usersRepository.create({
      Nombre: createUserDto.nombre,
      Apellido: createUserDto.apellido,
      Correo: createUserDto.correo,
      Contrasena: hashedPassword,
      Telefono: createUserDto.telefono,
      EstaActivo: createUserDto.estaActivo !== undefined ? createUserDto.estaActivo : true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (createUserDto.gruposIds && createUserDto.gruposIds.length > 0) {
      const grupos = await this.grupoRepository.findBy({
        id: In(createUserDto.gruposIds),
      });
      // No se puede asignar el grupo Admin al crear usuarios
      const gruposSinAdmin = grupos.filter((g) => !isAdminGroup(g));
      savedUser.grupos = gruposSinAdmin;
      await this.usersRepository.save(savedUser);
    }

    return this.findOne(savedUser.id);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['grupos'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.Nombre = updateUserDto.nombre;
    user.Apellido = updateUserDto.apellido;
    user.Correo = updateUserDto.correo;
    user.Telefono = updateUserDto.telefono;
    // Always update estaActivo when provided (handles both true and false)
    if (updateUserDto.estaActivo !== undefined) {
      user.EstaActivo = Boolean(updateUserDto.estaActivo);
    }

    if (updateUserDto.gruposIds !== undefined) {
      const grupos = await this.grupoRepository.findBy({
        id: In(updateUserDto.gruposIds),
      });
      const tieneAdmin = userHasAdminGroup(user);
      // Si ya tiene Admin, conservarlo; si no, no se puede asignar Admin
      const gruposFiltrados = grupos.filter((g) => !isAdminGroup(g));
      if (tieneAdmin) {
        const adminGrupo = user.grupos?.find(
          (g) => g.nombre?.trim().toLowerCase() === NOMBRE_GRUPO_ADMIN,
        );
        if (adminGrupo) {
          user.grupos = [...gruposFiltrados, adminGrupo];
        } else {
          user.grupos = gruposFiltrados;
        }
      } else {
        user.grupos = gruposFiltrados;
      }
    }

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['grupos'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    if (userHasAdminGroup(user)) {
      throw new ForbiddenException(
        'No se puede eliminar al usuario que pertenece al grupo Admin (usuario root).',
      );
    }
    await this.usersRepository.delete(id);
  }
}
