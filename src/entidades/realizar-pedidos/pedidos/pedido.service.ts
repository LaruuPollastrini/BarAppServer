import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedidos } from './pedidos.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Mesa } from '../mesa/mesas.entity';
import { Producto } from '../productos/productos.entity';
import { Estados } from './pedido.dto';
import { DetallesPedidoDto } from '../detallePedido/detallepedido.dto';
import { SessionService } from '../session/session.service';

@Injectable()
export class PedidoService {
  constructor(
    //agregarlos en modulos
    @InjectRepository(Pedidos)
    private pedidosRepository: Repository<Pedidos>,
    @InjectRepository(User)
    private usuarioRepository: Repository<User>,
    @InjectRepository(Mesa)
    private mesaRepository: Repository<Mesa>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(DetallesPedido)
    private detallesPedidoRepository: Repository<DetallesPedido>,
    private sessionService: SessionService,
  ) {}

  async findAll(): Promise<Pedidos[]> {
    const pedidos = await this.pedidosRepository.find({
      relations: [
        'user',
        'mesa',
        'ticket',
        'detallespedido',
        'detallespedido.producto',
      ],
    });
    return pedidos;
  }

  findOne(id: number): Promise<Pedidos | null> {
    return this.pedidosRepository.findOneBy({ idpedido: id });
  }

  /**
   * Find all pedidos for a specific mesa and verification code
   * WHY: Allows customers to view only their orders (filtered by codigoVerificacion)
   */
  async findByMesaAndCodigo(
    numeroMesa: number,
    codigoVerificacion: string,
  ): Promise<Pedidos[]> {
    // Validate input - require valid verification code
    if (!codigoVerificacion || codigoVerificacion.trim() === '') {
      return [];
    }

    const mesa = await this.mesaRepository.findOneBy({ numero: numeroMesa });
    if (!mesa) {
      return [];
    }

    const pedidos = await this.pedidosRepository.find({
      where: {
        mesa: { idmesa: mesa.idmesa },
        codigoVerificacion: codigoVerificacion,
      },
      relations: ['mesa', 'detallespedido', 'detallespedido.producto'],
      order: { fecha: 'DESC' },
    });

    // Filter out any pedidos with null/empty codigoVerificacion (shouldn't happen but just in case)
    return pedidos.filter(
      (p) => p.codigoVerificacion && p.codigoVerificacion.trim() !== '',
    );
  }

  /**
   * Find pedidos for a specific mesa filtered by current verification code (admin view)
   * WHY: Shows only pedidos from the current visit/session (same codigoVerificacion as the mesa)
   */
  async findByMesaAdmin(numeroMesa: number): Promise<Pedidos[]> {
    const mesa = await this.mesaRepository.findOneBy({ numero: numeroMesa });
    if (!mesa) {
      return [];
    }

    // If mesa has no verification code, return empty (no valid pedidos can exist)
    if (!mesa.codigoVerificacion || mesa.codigoVerificacion.trim() === '') {
      return [];
    }

    // Filter by mesa's current verification code to show only current visit's pedidos
    const pedidos = await this.pedidosRepository.find({
      where: {
        mesa: { idmesa: mesa.idmesa },
        codigoVerificacion: mesa.codigoVerificacion,
      },
      relations: ['mesa', 'detallespedido', 'detallespedido.producto'],
      order: { fecha: 'DESC' },
    });

    // Filter out any pedidos with null/empty codigoVerificacion (shouldn't happen but just in case)
    return pedidos.filter(
      (p) => p.codigoVerificacion && p.codigoVerificacion.trim() !== '',
    );
  }

  async agregar(
    idusuario: number | null,
    detallesPedido: DetallesPedidoDto[],
    idmesa: number,
    codigoVerificacion?: string | null,
  ): Promise<void> {
    try {
      let usuario: User | null = null;
      if (idusuario) {
        usuario = await this.usuarioRepository.findOneBy({ id: idusuario });
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }
      }

      const mesa = await this.mesaRepository.findOneBy({ idmesa: idmesa });
      if (!mesa) {
        throw new Error('Mesa no encontrada');
      }

      if (!mesa.estaAbierta) {
        throw new Error('La mesa está cerrada. No se pueden realizar pedidos.');
      }

      if (!detallesPedido.length) {
        throw new Error('No se han agregado detalles al pedido');
      }

      const detalles: DetallesPedido[] = [];
      for (let i = 0; i < detallesPedido.length; i++) {
        const dp = detallesPedido[i];
        const prod = await this.productoRepository.findOneBy({
          id: dp.producto.id,
        });
        if (!prod) {
          throw new Error(`Producto con ID ${dp.producto.id} no encontrado`);
        }
        const detalle = {
          cantidad: dp.cantidad,
          precioUnitario: prod.precio,
          producto: dp.producto as Producto,
        } as DetallesPedido;
        detalles.push(detalle);
      }

      const pedido: Omit<Pedidos, 'idpedido' | 'fecha' | 'ticket'> = {
        user: usuario,
        detallespedido: detalles,
        mesa,
        estado: Estados.Pendiente,
        codigoVerificacion: codigoVerificacion || null,
      };
      console.log(pedido);
      const pedidoCreado = this.pedidosRepository.create(pedido);
      await this.pedidosRepository.save(pedidoCreado);
      console.log(`Pedido creado con ID: ${pedidoCreado.idpedido}`);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Creates anonymous order with session validation
   * WHY: Requires sessionId and visitToken to prevent unauthorized orders
   */
  async agregarAnonimo(
    numeroMesa: number,
    detallesPedido: DetallesPedidoDto[],
    sessionId: string,
    visitToken: string,
  ): Promise<void> {
    // Validate session before processing order
    // WHY: Ensures request comes from valid device session with correct visit token
    await this.sessionService.validateOrderRequest(
      sessionId,
      visitToken,
      numeroMesa,
    );

    const mesa = await this.mesaRepository.findOneBy({ numero: numeroMesa });
    if (!mesa) {
      throw new Error('Mesa no encontrada');
    }

    // Pass the current verification code to associate the order with this client session
    return this.agregar(
      null,
      detallesPedido,
      mesa.idmesa,
      mesa.codigoVerificacion,
    );
  }

  /**
   * Handles invoice printed event - closes table and invalidates sessions
   * WHY: When invoice is printed, the visit ends - table closes and tokens invalidate
   */
  async handleInvoicePrinted(mesaId: number): Promise<void> {
    const mesa = await this.mesaRepository.findOneBy({ idmesa: mesaId });
    if (!mesa) {
      throw new Error('Mesa no encontrada');
    }

    // Close the table
    // WHY: Table is closed after invoice is printed
    mesa.estaAbierta = false;
    // Clear visitToken
    // WHY: Token is invalidated so new visit will generate new token
    mesa.visitToken = null;
    await this.mesaRepository.save(mesa);

    // Invalidate all sessions for this table
    // WHY: All device sessions become invalid when table closes
    await this.sessionService.invalidateTableSessions(mesaId);
  }
  async modificar(
    id: number,
    detallePedido: DetallesPedidoDto[],
  ): Promise<void> {
    try {
      const pedidoExistente = await this.pedidosRepository.findOne({
        where: { idpedido: id },
        relations: ['detallespedido', 'mesa', 'user', 'ticket'],
      });

      if (!pedidoExistente) {
        throw new Error('Pedido no encontrado');
      }

      await this.detallesPedidoRepository.delete({ pedido: { idpedido: id } });

      const detallesActualizados: DetallesPedido[] = [];
      for (let i = 0; i < detallePedido.length; i++) {
        const dp = detallePedido[i];
        const prod = await this.productoRepository.findOneBy({
          id: dp.producto.id,
        });
        if (!prod) {
          throw new Error(`Producto con ID ${dp.producto.id} no encontrado`);
        }
        const detalle = {
          cantidad: dp.cantidad,
          precioUnitario: prod.precio,
          producto: dp.producto as Producto,
          pedido: pedidoExistente,
        } as DetallesPedido;
        detallesActualizados.push(detalle);
      }

      pedidoExistente.detallespedido = detallesActualizados;

      await this.pedidosRepository.save(pedidoExistente);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('Error modificando pedido:', error.message);
      throw error;
    }
  }

  /**
   * Get count of pending pedidos per mesa (only mesas that have at least one pending).
   * WHY: Admin mesas page needs to show pending count per table for UX (badge, notification).
   */
  async getPendientesPorMesa(): Promise<
    Array<{ mesaId: number; count: number }>
  > {
    const raw = await this.pedidosRepository
      .createQueryBuilder('pedido')
      .select('pedido.mesaId', 'mesaId')
      .addSelect('COUNT(pedido.idpedido)', 'count')
      .where('pedido.estado = :estado', { estado: Estados.Pendiente })
      .groupBy('pedido.mesaId')
      .getRawMany<{ mesaId: number; count: string }>();
    return raw.map((r) => ({
      mesaId: Number(r.mesaId),
      count: Number(r.count) || 0,
    }));
  }

  async actualizarEstado(
    id: number,
    estado: Estados.Rechazado | Estados.Confirmado,
  ): Promise<void> {
    try {
      const pedidoExistente = await this.pedidosRepository.findOneBy({
        idpedido: id,
      });
      if (!pedidoExistente) {
        throw new Error('Pedido no encontrado');
      }
      await this.pedidosRepository.update(
        { idpedido: id },
        { ...pedidoExistente, estado },
      );
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Get most ordered products with statistics
   * WHY: Provides data for reports showing product popularity
   */
  async getMostOrderedProducts(categoria?: string): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      totalCantidad: number;
      totalPedidos: number;
      precioUnitario: number;
    }>
  > {
    // Get all detalles with producto and pedido relations
    const detalles = await this.detallesPedidoRepository.find({
      relations: ['producto', 'pedido'],
    });

    // Filter out deleted products and by categoria if provided
    const filteredDetalles = detalles
      .filter((d) => !d.producto.estaEliminado)
      .filter((d) =>
        categoria ? d.producto.categoria?.nombre === categoria : true,
      );

    // Aggregate by producto
    const productStats = new Map<
      number,
      {
        productoId: number;
        nombre: string;
        categoria: string;
        totalCantidad: number;
        totalPedidos: Set<number>;
        precioUnitario: number;
      }
    >();

    for (const detalle of filteredDetalles) {
      const productoId = detalle.producto.id;
      const existing = productStats.get(productoId);

      if (existing) {
        existing.totalCantidad += detalle.cantidad;
        existing.totalPedidos.add(detalle.pedido.idpedido);
      } else {
        productStats.set(productoId, {
          productoId: detalle.producto.id,
          nombre: detalle.producto.nombre,
          categoria: detalle.producto.categoria?.nombre ?? '',
          totalCantidad: detalle.cantidad,
          totalPedidos: new Set([detalle.pedido.idpedido]),
          precioUnitario: detalle.precioUnitario,
        });
      }
    }

    // Convert to array and sort by totalCantidad descending
    const result = Array.from(productStats.values())
      .map((stat) => ({
        productoId: stat.productoId,
        nombre: stat.nombre,
        categoria: stat.categoria,
        totalCantidad: stat.totalCantidad,
        totalPedidos: stat.totalPedidos.size,
        precioUnitario: stat.precioUnitario,
      }))
      .sort((a, b) => b.totalCantidad - a.totalCantidad);

    return result;
  }

  /**
   * Get least ordered products with statistics
   * WHY: Provides data for reports showing least popular products
   */
  async getLeastOrderedProducts(categoria?: string): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      totalCantidad: number;
      totalPedidos: number;
      precioUnitario: number;
    }>
  > {
    // Get all detalles with producto and pedido relations
    const detalles = await this.detallesPedidoRepository.find({
      relations: ['producto', 'pedido'],
    });

    // Filter out deleted products and by categoria if provided
    const filteredDetalles = detalles
      .filter((d) => !d.producto.estaEliminado)
      .filter((d) =>
        categoria ? d.producto.categoria?.nombre === categoria : true,
      );

    // Aggregate by producto
    const productStats = new Map<
      number,
      {
        productoId: number;
        nombre: string;
        categoria: string;
        totalCantidad: number;
        totalPedidos: Set<number>;
        precioUnitario: number;
      }
    >();

    for (const detalle of filteredDetalles) {
      const productoId = detalle.producto.id;
      const existing = productStats.get(productoId);

      if (existing) {
        existing.totalCantidad += detalle.cantidad;
        existing.totalPedidos.add(detalle.pedido.idpedido);
      } else {
        productStats.set(productoId, {
          productoId: detalle.producto.id,
          nombre: detalle.producto.nombre,
          categoria: detalle.producto.categoria?.nombre ?? '',
          totalCantidad: detalle.cantidad,
          totalPedidos: new Set([detalle.pedido.idpedido]),
          precioUnitario: detalle.precioUnitario,
        });
      }
    }

    // Convert to array and sort by totalCantidad ascending (least ordered first)
    const result = Array.from(productStats.values())
      .map((stat) => ({
        productoId: stat.productoId,
        nombre: stat.nombre,
        categoria: stat.categoria,
        totalCantidad: stat.totalCantidad,
        totalPedidos: stat.totalPedidos.size,
        precioUnitario: stat.precioUnitario,
      }))
      .sort((a, b) => a.totalCantidad - b.totalCantidad);

    return result;
  }

  /**
   * Get products that were never ordered
   * WHY: Provides data for reports showing products that need promotion
   */
  async getNeverOrderedProducts(categoria?: string): Promise<
    Array<{
      productoId: number;
      nombre: string;
      categoria: string;
      precio: number;
      descripcion: string;
    }>
  > {
    // Get all products that are not deleted
    const allProductos = await this.productoRepository.find({
      where: { estaEliminado: false },
    });

    // Filter by categoria if provided
    const filteredProductos = categoria
      ? allProductos.filter((p) => p.categoria?.nombre === categoria)
      : allProductos;

    // Get all productos that have been ordered (from detalles)
    const detalles = await this.detallesPedidoRepository.find({
      relations: ['producto'],
    });

    const orderedProductIds = new Set(
      detalles
        .filter((d) => !d.producto.estaEliminado)
        .map((d) => d.producto.id),
    );

    // Find products that were never ordered
    const neverOrdered = filteredProductos
      .filter((producto) => !orderedProductIds.has(producto.id))
      .map((producto) => ({
        productoId: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria?.nombre ?? '',
        precio: producto.precio,
        descripcion: producto.descripcion,
      }));

    return neverOrdered;
  }

  /**
   * Get income report with date range filtering
   * WHY: Provides income data for reports with date range filtering (better performance)
   */
  async getIncomeReport(
    startDate: string,
    endDate: string,
  ): Promise<{
    total: number;
    totalPedidos: number;
    period: string;
    breakdown?: Array<{ date: string; total: number; pedidos: number }>;
  }> {
    // Parse dates (YYYY-MM-DD)
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        total: 0,
        totalPedidos: 0,
        period: `${startDate} - ${endDate}`,
        breakdown: [],
      };
    }
    if (start > end) {
      return {
        total: 0,
        totalPedidos: 0,
        period: `${start.toLocaleDateString('es-AR')} - ${end.toLocaleDateString('es-AR')}`,
        breakdown: [],
      };
    }

    // Fetch all confirmed pedidos with details, then filter by date in JS (avoids MySQL date/timezone quirks)
    const allConfirmados = await this.pedidosRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.detallespedido', 'detallespedido')
      .where('pedido.estado = :estado', { estado: Estados.Confirmado })
      .getMany();

    const filteredPedidos = allConfirmados.filter((p) => {
      const d = new Date(p.fecha);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      return dateStr >= startDate && dateStr <= endDate;
    });

    // Format period string
    const period = `${start.toLocaleDateString('es-AR')} - ${end.toLocaleDateString('es-AR')}`;

    // Calculate totals
    let total = 0;
    for (const pedido of filteredPedidos) {
      const detalles = pedido.detallespedido ?? [];
      for (const detalle of detalles) {
        total += (detalle.cantidad ?? 0) * (detalle.precioUnitario ?? 0);
      }
    }

    // Generate breakdown by day (for date ranges)
    let breakdown:
      | Array<{ date: string; total: number; pedidos: number }>
      | undefined;
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Only generate breakdown if range is reasonable (less than 90 days)
    if (daysDiff <= 90) {
      breakdown = [];
      const breakdownMap = new Map<
        string,
        { total: number; pedidos: Set<number> }
      >();

      for (const pedido of filteredPedidos) {
        const pedidoDate = new Date(pedido.fecha);
        const key = pedidoDate.toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const detalles = pedido.detallespedido ?? [];

        const existing = breakdownMap.get(key);
        if (existing) {
          for (const detalle of detalles) {
            existing.total +=
              (detalle.cantidad ?? 0) * (detalle.precioUnitario ?? 0);
          }
          existing.pedidos.add(pedido.idpedido);
        } else {
          let pedidoTotal = 0;
          for (const detalle of detalles) {
            pedidoTotal +=
              (detalle.cantidad ?? 0) * (detalle.precioUnitario ?? 0);
          }
          breakdownMap.set(key, {
            total: pedidoTotal,
            pedidos: new Set([pedido.idpedido]),
          });
        }
      }

      breakdown = Array.from(breakdownMap.entries())
        .map(([date, data]) => ({
          date,
          total: data.total,
          pedidos: data.pedidos.size,
        }))
        .sort((a, b) => {
          // Sort by date - parse DD/MM/YYYY format
          const parseDate = (dateStr: string) => {
            const [day, month, year] = dateStr.split('/');
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          };
          return parseDate(a.date).getTime() - parseDate(b.date).getTime();
        });
    }

    return {
      total,
      totalPedidos: filteredPedidos.length,
      period,
      breakdown,
    };
  }

  /**
   * Get average ticket report with date range filtering
   * WHY: Provides average ticket value for reports (better performance)
   */
  async getAverageTicket(
    startDate: string,
    endDate: string,
  ): Promise<{
    average: number;
    totalTickets: number;
    totalRevenue: number;
    period: string;
  }> {
    // Parse dates (YYYY-MM-DD)
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        average: 0,
        totalTickets: 0,
        totalRevenue: 0,
        period: `${startDate} - ${endDate}`,
      };
    }
    if (start > end) {
      return {
        average: 0,
        totalTickets: 0,
        totalRevenue: 0,
        period: `${start.toLocaleDateString('es-AR')} - ${end.toLocaleDateString('es-AR')}`,
      };
    }

    // Fetch all confirmed pedidos with details, then filter by date in JS (avoids MySQL date/timezone quirks)
    const allConfirmados = await this.pedidosRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.detallespedido', 'detallespedido')
      .where('pedido.estado = :estado', { estado: Estados.Confirmado })
      .getMany();

    const filteredPedidos = allConfirmados.filter((p) => {
      const d = new Date(p.fecha);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;
      return dateStr >= startDate && dateStr <= endDate;
    });

    // Format period string
    const period = `${start.toLocaleDateString('es-AR')} - ${end.toLocaleDateString('es-AR')}`;

    // Calculate total revenue and count tickets (each pedido is a ticket)
    let totalRevenue = 0;
    for (const pedido of filteredPedidos) {
      const detalles = pedido.detallespedido ?? [];
      for (const detalle of detalles) {
        totalRevenue += (detalle.cantidad ?? 0) * (detalle.precioUnitario ?? 0);
      }
    }

    const totalTickets = filteredPedidos.length;
    const average = totalTickets > 0 ? totalRevenue / totalTickets : 0;

    return {
      average,
      totalTickets,
      totalRevenue,
      period,
    };
  }
}
