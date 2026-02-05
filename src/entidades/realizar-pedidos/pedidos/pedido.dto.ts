import { User } from 'src/entidades/seguridad/users/users.entity';
import { DetallesPedidoDto } from '../detallePedido/detallepedido.dto';

export interface PedidoDto {
  idpedido?: number;
  fecha?: Date;
  ticket?: string;
  estado?: string;
  user: User;
  mesaId: number;
  detallesPedido: DetallesPedidoDto[];
}

export enum Estados {
  Pendiente = 'Pendiente',
  Confirmado = 'Confirmado',
  Rechazado = 'Rechazado',
}
