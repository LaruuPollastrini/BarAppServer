import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, MoreThanOrEqual, Repository } from 'typeorm';
import { Agenda } from './agenda.entity';
import {
  AgendaConCupoDto,
  CrearAgendaDto,
  CrearRangoAgendaDto,
  ResultadoRangoDto,
} from './agenda.dto';
import { ESTADOS_QUE_OCUPAN_CUPO } from '../estados/estado-reserva.enum';

// Límites de negocio
const CAPACIDAD_MAXIMA = 500;
const MAX_TURNOS_POR_CARGA = 500;
const INTERVALO_MINIMO = 15;

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda)
    private agendaRepo: Repository<Agenda>,
  ) {}

  // ======================================================
  // ADMIN — Publicar un turno puntual
  // ======================================================
  async publicar(dto: CrearAgendaDto): Promise<AgendaConCupoDto> {
    const fecha = this.validarFecha(dto?.fecha, 'fecha');
    const horario = this.validarHorario(dto?.horario, 'horario');
    const capacidad = this.validarCapacidad(dto?.capacidad);

    if (!this.esFuturo(fecha, horario)) {
      throw new BadRequestException(
        'No se puede publicar un turno en una fecha u horario que ya pasó',
      );
    }

    const existente = await this.agendaRepo.findOne({
      where: { fecha, horario },
      relations: ['reservas'],
    });

    if (existente && existente.estaActiva) {
      throw new BadRequestException(
        `Ya hay un turno publicado el ${fecha} a las ${horario.slice(0, 5)}`,
      );
    }

    // Si el turno existía pero estaba dado de baja, se reactiva
    if (existente) {
      existente.estaActiva = true;
      existente.capacidad = capacidad;
      const guardado = await this.agendaRepo.save(existente);
      return this.conCupo(guardado);
    }

    const nuevo = this.agendaRepo.create({ fecha, horario, capacidad });
    const guardado = await this.agendaRepo.save(nuevo);
    return this.conCupo(guardado);
  }

  // ======================================================
  // ADMIN — Publicar un rango de turnos (CUD 006)
  // ======================================================
  async publicarRango(dto: CrearRangoAgendaDto): Promise<ResultadoRangoDto> {
    const desde = this.validarFecha(dto?.fechaDesde, 'fechaDesde');
    const hasta = this.validarFecha(dto?.fechaHasta, 'fechaHasta');
    if (hasta < desde) {
      throw new BadRequestException(
        'La fecha hasta no puede ser anterior a la fecha desde',
      );
    }

    const horaInicio = this.validarHorario(dto?.horaInicio, 'horaInicio');
    const horaFin = this.validarHorario(dto?.horaFin, 'horaFin');
    if (horaFin < horaInicio) {
      throw new BadRequestException(
        'La hora de fin no puede ser anterior a la hora de inicio',
      );
    }

    const intervalo = Number(dto?.intervaloMinutos);
    if (!Number.isInteger(intervalo) || intervalo < INTERVALO_MINIMO) {
      throw new BadRequestException(
        `El intervalo debe ser un número entero de al menos ${INTERVALO_MINIMO} minutos`,
      );
    }

    const capacidad = this.validarCapacidad(dto?.capacidad);
    const dias = this.validarDiasSemana(dto?.diasSemana);

    // 1) Generar los turnos candidatos (solo futuros)
    const candidatos: Array<{ fecha: string; horario: string }> = [];
    const inicioMin = this.aMinutos(horaInicio);
    const finMin = this.aMinutos(horaFin);

    for (
      let dia = this.parsearFecha(desde);
      this.formatearFecha(dia) <= hasta;
      dia.setDate(dia.getDate() + 1)
    ) {
      if (!dias.includes(dia.getDay())) continue;
      const fecha = this.formatearFecha(dia);

      for (let min = inicioMin; min <= finMin; min += intervalo) {
        const horario = this.desdeMinutos(min);
        if (this.esFuturo(fecha, horario)) {
          candidatos.push({ fecha, horario });
        }
      }

      if (candidatos.length > MAX_TURNOS_POR_CARGA) {
        throw new BadRequestException(
          `El rango genera más de ${MAX_TURNOS_POR_CARGA} turnos. Cargalo en partes más chicas.`,
        );
      }
    }

    if (candidatos.length === 0) {
      throw new BadRequestException(
        'El rango elegido no genera ningún turno futuro',
      );
    }

    // 2) Ver cuáles ya existen para no duplicarlos
    const existentes = await this.agendaRepo.find({
      where: { fecha: Between(desde, hasta) },
      relations: ['reservas'],
    });
    const porClave = new Map<string, Agenda>();
    existentes.forEach((a) => porClave.set(`${a.fecha}|${a.horario}`, a));

    const aGuardar: Agenda[] = [];
    let omitidos = 0;
    for (const c of candidatos) {
      const existente = porClave.get(`${c.fecha}|${c.horario}`);
      if (existente && existente.estaActiva) {
        omitidos++;
        continue;
      }
      if (existente) {
        existente.estaActiva = true;
        existente.capacidad = capacidad;
        aGuardar.push(existente);
      } else {
        aGuardar.push(
          this.agendaRepo.create({
            fecha: c.fecha,
            horario: c.horario,
            capacidad,
          }),
        );
      }
    }

    const guardados = await this.agendaRepo.save(aGuardar);
    return {
      creados: guardados.length,
      omitidos,
      turnos: guardados.map((a) => this.conCupo(a)),
    };
  }

  // ======================================================
  // ADMIN — Listar toda la agenda (opcionalmente entre fechas)
  // ======================================================
  async listarTodo(desde?: string, hasta?: string): Promise<AgendaConCupoDto[]> {
    const where: FindOptionsWhere<Agenda> = {};
    if (desde || hasta) {
      const d = desde ? this.validarFecha(desde, 'desde') : '1900-01-01';
      const h = hasta ? this.validarFecha(hasta, 'hasta') : '2999-12-31';
      where.fecha = Between(d, h);
    }

    const agenda = await this.agendaRepo.find({
      where,
      relations: ['reservas'],
      order: { fecha: 'ASC', horario: 'ASC' },
    });
    return agenda.map((a) => this.conCupo(a));
  }

  // ======================================================
  // CLIENTE — Turnos disponibles (activos, futuros y con cupo)
  // ======================================================
  async listarDisponibles(): Promise<AgendaConCupoDto[]> {
    const hoy = this.formatearFecha(new Date());
    const agenda = await this.agendaRepo.find({
      where: { estaActiva: true, fecha: MoreThanOrEqual(hoy) },
      relations: ['reservas'],
      order: { fecha: 'ASC', horario: 'ASC' },
    });

    return agenda
      .filter((a) => this.esFuturo(a.fecha, a.horario))
      .map((a) => this.conCupo(a))
      .filter((a) => a.cupoDisponible > 0);
  }

  // ======================================================
  // ADMIN — Modificar la capacidad de un turno
  // ======================================================
  async modificarCapacidad(
    idAgenda: number,
    capacidadNueva: number,
  ): Promise<AgendaConCupoDto> {
    const capacidad = this.validarCapacidad(capacidadNueva);
    const agenda = await this.buscarActiva(idAgenda);

    const ocupados = this.calcularOcupados(agenda);
    if (capacidad < ocupados) {
      throw new BadRequestException(
        `No se puede bajar la capacidad a ${capacidad}: ya hay ${ocupados} persona(s) con reserva pendiente o aceptada`,
      );
    }

    agenda.capacidad = capacidad;
    const guardado = await this.agendaRepo.save(agenda);
    return this.conCupo(guardado);
  }

  // ======================================================
  // ADMIN — Eliminar (baja lógica) un turno
  // ======================================================
  async eliminar(idAgenda: number): Promise<{ mensaje: string }> {
    const agenda = await this.buscarActiva(idAgenda);

    const activas = (agenda.reservas || []).filter((r) =>
      ESTADOS_QUE_OCUPAN_CUPO.includes(r.estado),
    );
    if (activas.length > 0) {
      throw new BadRequestException(
        `El turno tiene ${activas.length} reserva(s) pendiente(s) o aceptada(s). Rechazalas o esperá a que se cancelen antes de eliminarlo.`,
      );
    }

    agenda.estaActiva = false;
    await this.agendaRepo.save(agenda);
    return { mensaje: 'Turno eliminado correctamente' };
  }

  // ======================================================
  // Helpers
  // ======================================================

  private async buscarActiva(idAgenda: number): Promise<Agenda> {
    const agenda = await this.agendaRepo.findOne({
      where: { idAgenda },
      relations: ['reservas'],
    });
    if (!agenda || !agenda.estaActiva) {
      throw new NotFoundException('Turno no encontrado');
    }
    return agenda;
  }

  private calcularOcupados(agenda: Agenda): number {
    return (agenda.reservas || [])
      .filter((r) => ESTADOS_QUE_OCUPAN_CUPO.includes(r.estado))
      .reduce((total, r) => total + r.cantidadPersonas, 0);
  }

  private conCupo(agenda: Agenda): AgendaConCupoDto {
    const ocupados = this.calcularOcupados(agenda);
    return {
      idAgenda: agenda.idAgenda,
      fecha: agenda.fecha,
      horario: agenda.horario,
      capacidad: agenda.capacidad,
      estaActiva: agenda.estaActiva,
      ocupados,
      cupoDisponible: Math.max(agenda.capacidad - ocupados, 0),
    };
  }

  /** Valida 'YYYY-MM-DD' y que sea una fecha real (ej. rechaza 2026-02-30). */
  private validarFecha(valor: unknown, campo: string): string {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      throw new BadRequestException(
        `El campo "${campo}" debe tener el formato AAAA-MM-DD`,
      );
    }
    if (this.formatearFecha(this.parsearFecha(valor)) !== valor) {
      throw new BadRequestException(`El campo "${campo}" no es una fecha válida`);
    }
    return valor;
  }

  /** Valida 'HH:MM' o 'HH:MM:SS' y lo normaliza a 'HH:MM:SS' (como lo guarda MySQL). */
  private validarHorario(valor: unknown, campo: string): string {
    if (
      typeof valor !== 'string' ||
      !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(valor)
    ) {
      throw new BadRequestException(
        `El campo "${campo}" debe tener el formato HH:MM (ej. 21:00)`,
      );
    }
    return valor.length === 5 ? `${valor}:00` : valor;
  }

  private validarCapacidad(valor: unknown): number {
    const capacidad = Number(valor);
    if (
      !Number.isInteger(capacidad) ||
      capacidad < 1 ||
      capacidad > CAPACIDAD_MAXIMA
    ) {
      throw new BadRequestException(
        `La capacidad debe ser un número entero entre 1 y ${CAPACIDAD_MAXIMA}`,
      );
    }
    return capacidad;
  }

  private validarDiasSemana(valor: unknown): number[] {
    if (valor === undefined || valor === null) return [0, 1, 2, 3, 4, 5, 6];
    if (
      !Array.isArray(valor) ||
      valor.length === 0 ||
      !valor.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ) {
      throw new BadRequestException(
        'diasSemana debe ser una lista de números del 0 (domingo) al 6 (sábado)',
      );
    }
    return valor as number[];
  }

  /** true si la fecha + horario es posterior al momento actual. */
  private esFuturo(fecha: string, horario: string): boolean {
    return new Date(`${fecha}T${horario}`).getTime() > Date.now();
  }

  private parsearFecha(fecha: string): Date {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }

  private formatearFecha(fecha: Date): string {
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mm}-${dd}`;
  }

  private aMinutos(horario: string): number {
    const [h, m] = horario.split(':').map(Number);
    return h * 60 + m;
  }

  private desdeMinutos(minutos: number): string {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    return `${h}:${m}:00`;
  }
}