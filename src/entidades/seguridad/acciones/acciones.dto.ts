export class CreateAccionDto {
  nombre: string;
  formulariosIds?: number[];
}

export class UpdateAccionDto {
  nombre?: string;
  formulariosIds?: number[];
}

export class AccionResponseDto {
  id: number;
  nombre: string;
  formularios?: Array<{
    id: number;
    nombre: string;
  }>;
}
