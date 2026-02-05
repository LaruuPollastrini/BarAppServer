import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PedidoService } from './pedido.service';
import { Pedidos } from './pedidos.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';
import { DetallesPedidoDto } from '../detallePedido/detallepedido.dto';
import { Estados } from './pedido.dto';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidoService: PedidoService) {}
  @Get('/')
  async obtenerPedidos(): Promise<string> {
    return JSON.stringify(await this.pedidoService.findAll());
  }

  /**
   * GET /pedidos/mesa/:numeroMesa?codigo=XXXXXX
   * Gets all pedidos for a specific mesa and verification code
   * WHY: Allows customers to see only their orders (filtered by codigoVerificacion)
   */
  @Get('/mesa/:numeroMesa')
  obtenerPedidosPorMesa(
    @Param('numeroMesa') numeroMesa: string,
    @Query('codigo') codigoVerificacion: string,
  ): Promise<Pedidos[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return this.pedidoService.findByMesaAndCodigo(
      Number(numeroMesa),
      codigoVerificacion,
    );
  }

  /**
   * GET /pedidos/pendientes-por-mesa
   * Gets count of pending pedidos per mesa (only mesas with at least one pending).
   * WHY: Admin mesas page polls this for badges and notification.
   */
  @Get('/pendientes-por-mesa')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Ver Pedidos')
  obtenerPendientesPorMesa(): Promise<
    Array<{ mesaId: number; count: number }>
  > {
    return this.pedidoService.getPendientesPorMesa();
  }

  /**
   * GET /pedidos/admin/mesa/:numeroMesa
   * Gets ALL pedidos for a specific mesa (admin view - no code filter)
   * WHY: Allows admins to see all orders for a table regardless of verification code
   */
  @Get('/admin/mesa/:numeroMesa')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Ver Pedidos')
  obtenerPedidosPorMesaAdmin(
    @Param('numeroMesa') numeroMesa: string,
  ): Promise<Pedidos[]> {
    return this.pedidoService.findByMesaAdmin(Number(numeroMesa));
  }

  /**
   * PUT /pedidos/:id/estado
   * Updates the estado of a pedido
   * WHY: Allows admins to change order status
   */
  @Put('/:id/estado')
  @UseGuards(AuthGuard('jwt'))
  async actualizarEstado(
    @Param('id') id: number,
    @Body('estado') estado: string,
    @Req() req: { user: { tieneAccion: (a: string) => boolean } },
  ): Promise<string> {
    if (
      estado === 'Confirmado' &&
      !req.user.tieneAccion('Pedidos.Confirmar Pedido')
    ) {
      throw new ForbiddenException('No tienes permiso para confirmar pedidos');
    }
    if (
      estado === 'Rechazado' &&
      !req.user.tieneAccion('Pedidos.Rechazar Pedido')
    ) {
      throw new ForbiddenException('No tienes permiso para rechazar pedidos');
    }
    const estadoEnum =
      estado === 'Confirmado'
        ? Estados.Confirmado
        : estado === 'Rechazado'
          ? Estados.Rechazado
          : Estados.Pendiente;
    await this.pedidoService.actualizarEstado(
      id,
      estadoEnum as Estados.Confirmado | Estados.Rechazado,
    );
    return `Estado del pedido actualizado a ${estado}`;
  }
  @Post('/')
  async agregarPedido(
    @Body('detallesPedido') detallesPedido: DetallesPedido[],
    @Body('usuario') idusuario: number,
    @Body('mesa') idmesa: number,
  ): Promise<string> {
    await this.pedidoService.agregar(idusuario, detallesPedido, idmesa);
    return `El pedido ha sido agregado correctamente`;
  }

  /**
   * POST /pedidos/anonimo
   * Creates anonymous order - REQUIRES sessionId and visitToken
   * WHY: Security - prevents orders without valid session and visit token
   */
  @Post('/anonimo')
  async agregarPedidoAnonimo(
    @Body('numeroMesa') numeroMesa: number,
    @Body('detallesPedido') detallesPedido: DetallesPedidoDto[],
    @Body('sessionId') sessionId: string,
    @Body('visitToken') visitToken: string,
  ): Promise<string> {
    await this.pedidoService.agregarAnonimo(
      numeroMesa,
      detallesPedido,
      sessionId,
      visitToken,
    );
    return `El pedido ha sido agregado correctamente`;
  }

  /**
   * POST /pedidos/invoice-printed
   * Called when invoice/ticket is printed
   * WHY: Closes table and invalidates all sessions for that table
   */
  @Post('/invoice-printed')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Cerrar Mesa')
  async invoicePrinted(@Body('mesaId') mesaId: number): Promise<string> {
    await this.pedidoService.handleInvoicePrinted(mesaId);
    return `Mesa cerrada y sesiones invalidadas correctamente`;
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Editar Pedido')
  async modificarPedido(
    @Param('id') id: number,
    @Body('detallesPedido') detalles: DetallesPedidoDto[],
  ): Promise<string> {
    await this.pedidoService.modificar(id, detalles);
    return `Pedido con ID ${id} actualizado correctamente`;
  }

  @Put('/:id/confirmar')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Pedidos.Confirmar Pedido')
  async confirmarPedido(@Param('id') id: number): Promise<string> {
    await this.pedidoService.actualizarEstado(id, Estados.Confirmado);
    return `Pedido con ID ${id} confirmado`;
  }

  @Put('/:id/cancelar')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Pedidos.Rechazar Pedido')
  async cancelarPedido(@Param('id') id: number): Promise<string> {
    await this.pedidoService.actualizarEstado(id, Estados.Rechazado);
    return `Pedido con ID ${id} se ha cancelado correctamente`;
  }

  /**
   * GET /pedidos/reportes/productos-mas-pedidos
   * Gets most ordered products with statistics
   * WHY: Provides data for reports page
   */
  @Get('/reportes/productos-mas-pedidos')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Reportes.Ver Productos Mas Pedidos')
  async getMostOrderedProducts(@Query('categoria') categoria?: string): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      totalCantidad: number;
      totalPedidos: number;
      precioUnitario: number;
    }>
  > {
    return this.pedidoService.getMostOrderedProducts(categoria);
  }

  /**
   * GET /pedidos/reportes/ingresos
   * Gets income report with date range filtering
   * WHY: Provides income data for reports with better performance
   */
  @Get('/reportes/ingresos')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Reportes.Reporte de Ingresos')
  async getIncomeReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    total: number;
    totalPedidos: number;
    period: string;
    breakdown?: Array<{ date: string; total: number; pedidos: number }>;
  }> {
    if (!startDate?.trim() || !endDate?.trim()) {
      throw new BadRequestException(
        'startDate y endDate son requeridos (formato YYYY-MM-DD)',
      );
    }
    return this.pedidoService.getIncomeReport(startDate.trim(), endDate.trim());
  }

  /**
   * GET /pedidos/reportes/ticket-promedio
   * Gets average ticket report with date range filtering
   * WHY: Provides average ticket value for reports with better performance
   */
  @Get('/reportes/ticket-promedio')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Reportes.Ticket Promedio')
  async getAverageTicket(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    average: number;
    totalTickets: number;
    totalRevenue: number;
    period: string;
  }> {
    if (!startDate?.trim() || !endDate?.trim()) {
      throw new BadRequestException(
        'startDate y endDate son requeridos (formato YYYY-MM-DD)',
      );
    }
    return this.pedidoService.getAverageTicket(
      startDate.trim(),
      endDate.trim(),
    );
  }

  /**
   * GET /pedidos/reportes/productos-menos-pedidos
   * Gets least ordered products with statistics
   * WHY: Provides data for reports showing least popular products
   */
  @Get('/reportes/productos-menos-pedidos')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Reportes.Ver Productos Menos Pedidos')
  async getLeastOrderedProducts(
    @Query('categoria') categoria?: string,
  ): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      totalCantidad: number;
      totalPedidos: number;
      precioUnitario: number;
    }>
  > {
    return this.pedidoService.getLeastOrderedProducts(categoria);
  }

  /**
   * GET /pedidos/reportes/productos-nunca-pedidos
   * Gets products that were never ordered
   * WHY: Provides data for reports showing products that need promotion
   */
  @Get('/reportes/productos-nunca-pedidos')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Reportes.Ver Productos Nunca Pedidos')
  async getNeverOrderedProducts(
    @Query('categoria') categoria?: string,
  ): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      precio: number;
      descripcion: string;
    }>
  > {
    return this.pedidoService.getNeverOrderedProducts(categoria);
  }
}
