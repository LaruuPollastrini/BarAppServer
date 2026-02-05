export class CreateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  formulariosIds?: number[];
}

export class UpdateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  formulariosIds?: number[];
}

export class GrupoResponseDto {
  id: number;
  nombre: string;
  estaActivo: boolean;
  formularios?: Array<{
    id: number;
    nombre: string;
  }>;
}
