export class CreateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  accionesIds?: number[];
}

export class UpdateGrupoDto {
  nombre: string;
  estaActivo?: boolean;
  accionesIds?: number[];
}

export class GrupoResponseDto {
  id: number;
  nombre: string;
  estaActivo: boolean;
  acciones?: Array<{
    id: number;
    nombre: string;
    formulario?: {
      id: number;
      nombre: string;
    };
  }>;
}
