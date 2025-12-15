import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './users.entity';
import { Grupo } from '../grupos/grupos.entity';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './users.dto';

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
        estado: grupo.Estado,
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
          Estado: true,
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
          Estado: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.transformToResponseDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const user = this.usersRepository.create({
      Nombre: createUserDto.nombre,
      Apellido: createUserDto.apellido,
      Correo: createUserDto.correo,
      Contrasena: createUserDto.contrasena,
      Telefono: createUserDto.telefono,
      EstaActivo: createUserDto.estaActivo !== undefined ? createUserDto.estaActivo : true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (createUserDto.gruposIds && createUserDto.gruposIds.length > 0) {
      const grupos = await this.grupoRepository.findBy({
        id: In(createUserDto.gruposIds),
      });
      savedUser.grupos = grupos;
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
    if (updateUserDto.estaActivo !== undefined) {
      user.EstaActivo = updateUserDto.estaActivo;
    }

    if (updateUserDto.gruposIds !== undefined) {
      const grupos = await this.grupoRepository.findBy({
        id: In(updateUserDto.gruposIds),
      });
      user.grupos = grupos;
    }

    await this.usersRepository.save(user);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Check if user exists
    await this.usersRepository.delete(id);
  }
}
