import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Agenda } from '../agenda/agenda.entity';
import { Reserva } from '../reservas/reserva.entity';
import { EstadoReserva } from '../estados/estado-reserva.enum';
import {
  esFuturo,
  formatearFecha,
  parsearFecha,
  validarFecha,
} from '../fechas.util';
import {
  EstadoCantidadDto,
  OcupacionAgrupadaDto,
  OcupacionTurnoDto,
  PeriodoDto,
  ReporteEstadosDto,
  ReporteOcupacionDto,
} from './reportes-reserva.dto';

// Para la ocupación cuentan las reservas vigentes y las que se concretaron
const ESTADOS_QUE_OCUPAN: string[] = [
  EstadoReserva.Pendiente,
  EstadoReserva.Aceptada,
  EstadoReserva.Cerrada,
];

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

@Injectable()
export class ReportesReservaService {
  constructor(
    @InjectRepository(Agenda)
    private agendaRepo: Repository<Agenda>,
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
  ) {}

  // =====================================================
  // REPORTE 1 — Ocupación por turno
  // =====================================================
  async ocupacion(desde?: string, hasta?: string): Promise<ReporteOcupacionDto> {
    const periodo = this.periodo(desde, hasta);

    const agenda = await this.agendaRepo.find({
      where: { estaActiva: true, fecha: Between(periodo.desde, periodo.hasta) },
      relations: ['reservas'],
      order: { fecha: 'ASC', horario: 'ASC' },
    });

    const porTurno: OcupacionTurnoDto[] = agenda.map((a) => {
      const vigentes = (a.reservas || []).filter((r) =>
        ESTADOS_QUE_OCUPAN.includes(r.estado),
      );
      const personas = vigentes.reduce((t, r) => t + r.cantidadPersonas, 0);
      return {
        idAgenda: a.idAgenda,
        fecha: a.fecha,
        horario: a.horario.slice(0, 5),
        diaSemana: DIAS[parsearFecha(a.fecha).getDay()],
        capacidad: a.capacidad,
        reservas: vigentes.length,
        personasReservadas: personas,
        porcentajeOcupacion: this.porcentaje(personas, a.capacidad),
      };
    });

    const capacidadTotal = porTurno.reduce((t, x) => t + x.capacidad, 0);
    const personasReservadas = porTurno.reduce(
      (t, x) => t + x.personasReservadas,
      0,
    );

    const turnoMasDemandado = porTurno.length
      ? porTurno.reduce((max, x) =>
          x.porcentajeOcupacion > max.porcentajeOcupacion ? x : max,
        )
      : null;

    const porDiaSemana = this.agrupar(porTurno, (t) => t.diaSemana).sort(
      (a, b) => ORDEN_DIAS.indexOf(a.etiqueta) - ORDEN_DIAS.indexOf(b.etiqueta),
    );
    const porHorario = this.agrupar(porTurno, (t) => t.horario).sort((a, b) =>
      a.etiqueta.localeCompare(b.etiqueta),
    );

    return {
      resumen: {
        periodo,
        turnos: porTurno.length,
        capacidadTotal,
        personasReservadas,
        ocupacionPromedio: this.porcentaje(personasReservadas, capacidadTotal),
        turnoMasDemandado,
      },
      porTurno,
      porDiaSemana,
      porHorario,
    };
  }

  // =====================================================
  // REPORTE 2 — Reservas por estado
  // (se filtra por la fecha del TURNO, no por la fecha de solicitud)
  // =====================================================
  async estados(desde?: string, hasta?: string): Promise<ReporteEstadosDto> {
    const periodo = this.periodo(desde, hasta);

    const reservas = await this.reservaRepo.find({
      where: { agenda: { fecha: Between(periodo.desde, periodo.hasta) } },
      relations: ['agenda'],
    });

    const total = reservas.length;
    const totalPersonas = reservas.reduce((t, r) => t + r.cantidadPersonas, 0);

    const porEstado: EstadoCantidadDto[] = Object.values(EstadoReserva).map(
      (estado) => {
        const delEstado = reservas.filter((r) => r.estado === estado);
        return {
          estado,
          cantidad: delEstado.length,
          personas: delEstado.reduce((t, r) => t + r.cantidadPersonas, 0),
          porcentaje: this.porcentaje(delEstado.length, total),
        };
      },
    );

    const cantidad = (estado: EstadoReserva) =>
      porEstado.find((e) => e.estado === estado)?.cantidad ?? 0;

    // Asistencia: de las reservas aceptadas cuyo turno ya pasó, cuántas se cerraron
    // (una Aceptada de un turno pasado que no se cerró = el cliente no vino)
    const aceptadasPasadas = reservas.filter(
      (r) =>
        (r.estado === EstadoReserva.Aceptada || r.estado === EstadoReserva.Cerrada) &&
        r.agenda &&
        !esFuturo(r.agenda.fecha, r.agenda.horario),
    );
    const cerradas = aceptadasPasadas.filter(
      (r) => r.estado === EstadoReserva.Cerrada,
    ).length;

    return {
      resumen: {
        periodo,
        totalReservas: total,
        totalPersonas,
        tasaCancelacion: this.porcentaje(cantidad(EstadoReserva.Cancelada), total),
        tasaRechazo: this.porcentaje(cantidad(EstadoReserva.Rechazada), total),
        tasaAsistencia: aceptadasPasadas.length
          ? this.porcentaje(cerradas, aceptadasPasadas.length)
          : null,
      },
      porEstado,
    };
  }

  // =====================================================
  // Helpers
  // =====================================================

  /** Período del reporte. Sin fechas = mes actual. */
  private periodo(desde?: string, hasta?: string): PeriodoDto {
    const hoy = new Date();
    const d = desde
      ? validarFecha(desde, 'desde')
      : formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    const h = hasta
      ? validarFecha(hasta, 'hasta')
      : formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
    if (h < d) {
      throw new BadRequestException('La fecha hasta no puede ser anterior a desde');
    }
    return { desde: d, hasta: h };
  }

  private agrupar(
    turnos: OcupacionTurnoDto[],
    clave: (t: OcupacionTurnoDto) => string,
  ): OcupacionAgrupadaDto[] {
    const grupos = new Map<string, OcupacionAgrupadaDto>();
    for (const t of turnos) {
      const k = clave(t);
      const g = grupos.get(k) ?? {
        etiqueta: k,
        turnos: 0,
        capacidad: 0,
        personasReservadas: 0,
        porcentajeOcupacion: 0,
      };
      g.turnos++;
      g.capacidad += t.capacidad;
      g.personasReservadas += t.personasReservadas;
      grupos.set(k, g);
    }
    return Array.from(grupos.values()).map((g) => ({
      ...g,
      porcentajeOcupacion: this.porcentaje(g.personasReservadas, g.capacidad),
    }));
  }

  /** Porcentaje con 1 decimal. */
  private porcentaje(parte: number, total: number): number {
    if (!total) return 0;
    return Math.round((parte / total) * 1000) / 10;
  }
}