export class CreateModuloDto {
  nombre: string;
}

export class UpdateModuloDto {
  nombre: string;
}

export class ModuloResponseDto {
  id: number;
  nombre: string;
  formularios?: Array<{
    id: number;
    nombre: string;
  }>;
}

