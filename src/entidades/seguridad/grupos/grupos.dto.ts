export class CreateGrupoDto {
  nombre: string;
  Estado?: boolean;
  acciones_ids?: number[];
}

export class UpdateGrupoDto {
  nombre: string;
  Estado?: boolean;
  acciones_ids?: number[];
}

