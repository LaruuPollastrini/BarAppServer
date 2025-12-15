export class CreateAccionDto {
  nombre: string;
  formularioId: number;
}

export class UpdateAccionDto {
  nombre: string;
  formularioId: number;
}

export class AccionResponseDto {
  id: number;
  nombre: string;
  formulario?: {
    id: number;
    nombre: string;
  };
}
