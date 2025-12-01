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
      Nombre: createUserDto.Nombre,
      Apellido: createUserDto.Apellido,
      Correo: createUserDto.Correo,
      Contrasena: createUserDto.Contrasena,
      Telefono: createUserDto.Telefono,
      EstaActivo: createUserDto.EstaActivo !== undefined ? createUserDto.EstaActivo : true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (createUserDto.grupos_ids && createUserDto.grupos_ids.length > 0) {
      const grupos = await this.grupoRepository.findBy({
        id: In(createUserDto.grupos_ids),
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

    user.Nombre = updateUserDto.Nombre;
    user.Apellido = updateUserDto.Apellido;
    user.Correo = updateUserDto.Correo;
    user.Telefono = updateUserDto.Telefono;
    if (updateUserDto.EstaActivo !== undefined) {
      user.EstaActivo = updateUserDto.EstaActivo;
    }

    if (updateUserDto.grupos_ids !== undefined) {
      const grupos = await this.grupoRepository.findBy({
        id: In(updateUserDto.grupos_ids),
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
