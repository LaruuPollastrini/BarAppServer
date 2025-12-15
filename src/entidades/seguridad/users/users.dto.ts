export class CreateUserDto {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
  estaActivo?: boolean;
  gruposIds?: number[];
}

export class UpdateUserDto {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  estaActivo?: boolean;
  gruposIds?: number[];
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
