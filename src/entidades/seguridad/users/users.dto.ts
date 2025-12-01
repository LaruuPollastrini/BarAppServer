export class CreateUserDto {
  Nombre: string;
  Apellido: string;
  Correo: string;
  Contrasena: string;
  Telefono: string;
  EstaActivo?: boolean;
  grupos_ids?: number[];
}

export class UpdateUserDto {
  Nombre: string;
  Apellido: string;
  Correo: string;
  Telefono: string;
  EstaActivo?: boolean;
  grupos_ids?: number[];
}

export class UserResponseDto {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estaActivo: boolean;
  grupos?: Array<{
    id: number;
    nombre: string;
    estado: boolean;
  }>;
}

