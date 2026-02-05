export class CreateModuloDto {
  nombre: string;
  /** IDs de formularios a asignar a este módulo (opcional) */
  formularioIds?: number[];
}

export class UpdateModuloDto {
  nombre: string;
  /** IDs de formularios asignados a este módulo (opcional; si se envía, se reasignan) */
  formularioIds?: number[];
}

export class ModuloResponseDto {
  id: number;
  nombre: string;
  formularios?: Array<{
    id: number;
    nombre: string;
  }>;
}
