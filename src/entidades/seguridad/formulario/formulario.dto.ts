export class CreateFormularioDto {
  nombre: string;
  moduloId: number;
  accionesIds?: number[];
}

export class UpdateFormularioDto {
  nombre: string;
  moduloId: number;
  accionesIds?: number[];
}

export class FormularioResponseDto {
  id: number;
  nombre: string;
  modulo?: {
    id: number;
    nombre: string;
  };
  acciones?: Array<{
    id: number;
    nombre: string;
  }>;
}
