export class CreateGrupoDto {
  nombre: string;
  estado?: boolean;
  accionesIds?: number[];
}

export class UpdateGrupoDto {
  nombre: string;
  estado?: boolean;
  accionesIds?: number[];
}

export class GrupoResponseDto {
  id: number;
  nombre: string;
  estado: boolean;
  acciones?: Array<{
    id: number;
    nombre: string;
    formulario?: {
      id: number;
      nombre: string;
    };
  }>;
}
