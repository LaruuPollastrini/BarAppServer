import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { PedidoService } from "./pedido.service";
import { Pedidos } from "./pedidos.entity";
import { DetallesPedido } from "../detallePedido/detallespedido.entity";
import { DetallesPedidoDto } from "../detallePedido/detallepedido.dto";
import { Estados } from "./pedido.dto";


@Controller("pedidos")
export class PedidosController {
  constructor(private readonly pedidoService: PedidoService) {}
@Get("/")
  async obtenerPedidos(): Promise<string> {
    return JSON.stringify(await this.pedidoService.findAll());
  }
   @Post("/")
  async agregarPedido(@Body("detallesPedido") detallesPedido: DetallesPedido[], @Body("usuario") idusuario: number, @Body("mesa") idmesa: number
): Promise<string> {
    await this.pedidoService.agregar(idusuario, detallesPedido, idmesa);
    return `El pedido ha sido agregado correctamente`;
  }

  @Put("/:id")
  async modificarPedido(@Param("id") id: number, @Body("detallesPedido") detalles: DetallesPedidoDto[]
): Promise<string> {
    await this.pedidoService.modificar(id, detalles);
    return `Pedido con ID ${id} actualizado correctamente`;
  }

   @Put("/:id/confirmar")
  async confirmarPedido(@Param("id") id: number
): Promise<string> {
    await this.pedidoService.actualizarEstado(id, Estados.Confirmado);
    return `Pedido con ID ${id} confirmado`;
  }

  @Put("/:id/cancelar")
  async cancelarPedido(@Param("id") id: number
): Promise<string> {
    await this.pedidoService.actualizarEstado(id, Estados.Rechazado);
    return `Pedido con ID ${id} se ha cancelado correctamente`;
  }
}
