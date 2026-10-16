import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { AuditoriaSesion, TipoEventoSesion } from './auditoria-sesion.entity';
import { ReservaHistorial } from '../../realizar-reserva/reservas/reserva-historial.entity';
import { User } from '../users/users.entity';
import {
  CambioReservaDto,
  EventoSesionDto,
  ReporteSesionesDto,
} from './auditoria.dto';
import {
  parsearFecha,
  validarFecha,
} from '../../realizar-reserva/fechas.util';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(AuditoriaSesion)
    private sesionRepo: Repository<AuditoriaSesion>,
    @InjectRepository(ReservaHistorial)
    private historialRepo: Repository<ReservaHistorial>,
  ) {}

  // =====================================================
  // Registrar un evento de sesión.
  // Si falla, NO interrumpe el login/logout: solo se informa por consola.
  // =====================================================
  async registrarSesion(
    tipo: TipoEventoSesion,
    datos: {
      usuario?: User | null;
      correo?: string;
      detalle?: string;
      ip?: string;
    },
  ): Promise<void> {
    try {
      await this.sesionRepo.save(
        this.sesionRepo.create({
          tipo,
          usuario: datos.usuario ? ({ id: datos.usuario.id } as User) : null,
          correo: (datos.correo ?? '').slice(0, 255),
          detalle: datos.detalle ?? null,
          ip: datos.ip ?? null,
        }),
      );
    } catch (error) {
      console.error('[auditoria] No se pudo registrar el evento de sesión', error);
    }
  }

  // =====================================================
  // REPORTE — Inicios y cierres de sesión
  // =====================================================
  async reporteSesiones(filtros: {
    desde?: string;
    hasta?: string;
    tipo?: string;
    usuarioId?: string;
  }): Promise<ReporteSesionesDto> {
    const where: FindOptionsWhere<AuditoriaSesion> = {};

    const rango = this.rangoFechas(filtros.desde, filtros.hasta);
    if (rango) where.fecha = rango;

    if (filtros.tipo) {
      const tipos = Object.values(TipoEventoSesion) as string[];
      if (!tipos.includes(filtros.tipo)) {
        throw new BadRequestException(
          `Tipo inválido. Valores posibles: ${tipos.join(', ')}`,
        );
      }
      where.tipo = filtros.tipo;
    }

    if (filtros.usuarioId) {
      where.usuario = { id: this.validarId(filtros.usuarioId, 'usuarioId') };
    }

    const eventos = await this.sesionRepo.find({
      where,
      relations: ['usuario'],
      order: { fecha: 'DESC' },
    });

    const lista: EventoSesionDto[] = eventos.map((e) => ({
      id: e.id,
      fecha: e.fecha,
      tipo: e.tipo,
      correo: e.correo,
      usuario: e.usuario ? `${e.usuario.Nombre} ${e.usuario.Apellido}` : null,
      detalle: e.detalle,
      ip: e.ip,
    }));

    return {
      resumen: {
        logins: lista.filter((e) => e.tipo === TipoEventoSesion.Login).length,
        loginsFallidos: lista.filter(
          (e) => e.tipo === TipoEventoSesion.LoginFallido,
        ).length,
        logouts: lista.filter((e) => e.tipo === TipoEventoSesion.Logout).length,
      },
      eventos: lista,
    };
  }

  // =====================================================
  // REPORTE — Trazabilidad de reservas (historial de cambios de estado)
  // =====================================================
  async reporteReservas(filtros: {
    desde?: string;
    hasta?: string;
    usuarioId?: string;
    idReserva?: string;
  }): Promise<CambioReservaDto[]> {
    const where: FindOptionsWhere<ReservaHistorial> = {};

    const rango = this.rangoFechas(filtros.desde, filtros.hasta);
    if (rango) where.fecha = rango;

    // Quién hizo el cambio
    if (filtros.usuarioId) {
      where.usuario = { id: this.validarId(filtros.usuarioId, 'usuarioId') };
    }

    // Trazabilidad completa de una reserva puntual
    if (filtros.idReserva) {
      where.reserva = {
        idReserva: this.validarId(filtros.idReserva, 'idReserva'),
      };
    }

    const cambios = await this.historialRepo.find({
      where,
      relations: ['reserva', 'reserva.user', 'reserva.agenda', 'usuario'],
      order: { fecha: 'DESC', idHistorial: 'DESC' },
    });

    return cambios.map((h) => ({
      idHistorial: h.idHistorial,
      fecha: h.fecha,
      idReserva: h.reserva?.idReserva,
      cliente: h.reserva?.user
        ? `${h.reserva.user.Nombre} ${h.reserva.user.Apellido}`
        : null,
      turno: h.reserva?.agenda
        ? { fecha: h.reserva.agenda.fecha, horario: h.reserva.agenda.horario }
        : null,
      cantidadPersonas: h.reserva?.cantidadPersonas ?? null,
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      realizadoPor: h.usuario ? `${h.usuario.Nombre} ${h.usuario.Apellido}` : null,
    }));
  }

  // =====================================================
  // Helpers
  // =====================================================

  /** Convierte desde/hasta ('YYYY-MM-DD') en un rango de días completos. */
  private rangoFechas(desde?: string, hasta?: string) {
    if (!desde && !hasta) return undefined;
    const inicio = desde
      ? parsearFecha(validarFecha(desde, 'desde'))
      : new Date(1900, 0, 1);
    const fin = hasta
      ? parsearFecha(validarFecha(hasta, 'hasta'))
      : new Date(2999, 11, 31);
    fin.setHours(23, 59, 59, 999);
    if (fin < inicio) {
      throw new BadRequestException('La fecha hasta no puede ser anterior a desde');
    }
    return Between(inicio, fin);
  }

  private validarId(valor: string, campo: string): number {
    const id = Number(valor);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException(`El campo "${campo}" debe ser un número válido`);
    }
    return id;
  }
}