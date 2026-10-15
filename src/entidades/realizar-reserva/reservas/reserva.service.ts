import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';
import { Reserva } from './reserva.entity';
import { ReservaHistorial } from './reserva-historial.entity';
import { Agenda } from '../agenda/agenda.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import {
  CrearReservaDto,
  ReservaRespuestaDto,
} from './reserva.dto';
import {
  ESTADOS_QUE_OCUPAN_CUPO,
  EstadoReserva,
} from '../estados/estado-reserva.enum';
import { esFuturo, hoy, validarFecha } from '../fechas.util';

// Acciones que identifican al personal del bar (pueden ver reservas de cualquier cliente)
const ACCIONES_PERSONAL = [
  'Gestionar Reservas.Ver Reservas',
  'Recibir Reservas.Ver Reservas del Dia',
];

@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
    private dataSource: DataSource,
  ) {}

  // =====================================================
  // CLIENTE — Crear reserva
  // =====================================================
  async crearReserva(
    cliente: User,
    dto: CrearReservaDto,
  ): Promise<ReservaRespuestaDto> {
    const agendaId = Number(dto?.agendaId);
    if (!Number.isInteger(agendaId) || agendaId < 1) {
      throw new BadRequestException('Tenés que elegir un turno (agendaId)');
    }

    const personas = Number(dto?.cantidadPersonas);
    if (!Number.isInteger(personas) || personas < 1) {
      throw new BadRequestException(
        'La cantidad de personas debe ser un número entero mayor a cero',
      );
    }

    // Transacción + bloqueo del turno: si dos clientes reservan el mismo turno
    // al mismo tiempo, el segundo espera a que termine el primero y ve el cupo actualizado.
    const idReserva = await this.dataSource.transaction(async (manager) => {
      const agenda = await manager.findOne(Agenda, {
        where: { idAgenda: agendaId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!agenda || !agenda.estaActiva) {
        throw new NotFoundException(
          'El turno elegido no existe o ya no está disponible',
        );
      }
      if (!esFuturo(agenda.fecha, agenda.horario)) {
        throw new BadRequestException('El turno elegido ya pasó');
      }

      const activas = await manager.find(Reserva, {
        where: {
          agenda: { idAgenda: agendaId },
          estado: In(ESTADOS_QUE_OCUPAN_CUPO),
        },
        relations: ['user'],
      });

      if (activas.some((r) => r.user?.id === cliente.id)) {
        throw new BadRequestException(
          'Ya tenés una reserva pendiente o aceptada para este turno',
        );
      }

      const ocupados = activas.reduce((t, r) => t + r.cantidadPersonas, 0);
      const cupo = agenda.capacidad - ocupados;
      if (personas > cupo) {
        throw new BadRequestException(
          cupo > 0
            ? `Solo quedan ${cupo} lugar(es) disponibles para este turno`
            : 'El turno ya no tiene lugares disponibles',
        );
      }

      const reserva = manager.create(Reserva, {
        user: { id: cliente.id } as User,
        agenda,
        cantidadPersonas: personas,
        estado: EstadoReserva.Pendiente,
      });
      const guardada = await manager.save(reserva);

      // Primer registro del historial: la creación
      await manager.save(
        manager.create(ReservaHistorial, {
          reserva: guardada,
          estadoAnterior: null,
          estadoNuevo: EstadoReserva.Pendiente,
          usuario: { id: cliente.id } as User,
        }),
      );

      return guardada.idReserva;
    });

    return this.obtenerDetalle(idReserva, cliente);
  }

  // =====================================================
  // CLIENTE — Mis reservas
  // =====================================================
  async misReservas(cliente: User): Promise<ReservaRespuestaDto[]> {
    const reservas = await this.reservaRepo.find({
      where: { user: { id: cliente.id } },
      relations: ['agenda'],
      order: { fechaSolicitud: 'DESC' },
    });
    return reservas.map((r) => this.aRespuesta(r));
  }

  // =====================================================
  // GESTIÓN — Listar reservas con filtros
  // GET /reservas?estado=Pendiente&desde=2026-10-01&hasta=2026-10-31
  // =====================================================
  async listar(
    estado?: string,
    desde?: string,
    hasta?: string,
  ): Promise<ReservaRespuestaDto[]> {
    const where: FindOptionsWhere<Reserva> = {};

    if (estado) {
      const estadosValidos = Object.values(EstadoReserva) as string[];
      if (!estadosValidos.includes(estado)) {
        throw new BadRequestException(
          `Estado inválido. Valores posibles: ${estadosValidos.join(', ')}`,
        );
      }
      where.estado = estado;
    }

    if (desde || hasta) {
      const d = desde ? validarFecha(desde, 'desde') : '1900-01-01';
      const h = hasta ? validarFecha(hasta, 'hasta') : '2999-12-31';
      where.agenda = { fecha: Between(d, h) };
    }

    const reservas = await this.reservaRepo.find({
      where,
      relations: ['user', 'agenda'],
      order: { agenda: { fecha: 'ASC', horario: 'ASC' }, fechaSolicitud: 'ASC' },
    });
    return reservas.map((r) => this.aRespuesta(r, { incluirCliente: true }));
  }

  // =====================================================
  // RECEPCIÓN — Reservas aceptadas (y ya cerradas) de un día
  // GET /reservas/del-dia?fecha=2026-10-24  (sin fecha = hoy)
  // =====================================================
  async delDia(fecha?: string): Promise<ReservaRespuestaDto[]> {
    const dia = fecha ? validarFecha(fecha, 'fecha') : hoy();

    const reservas = await this.reservaRepo.find({
      where: {
        agenda: { fecha: dia },
        estado: In([EstadoReserva.Aceptada, EstadoReserva.Cerrada]),
      },
      relations: ['user', 'agenda'],
      order: { agenda: { horario: 'ASC' } },
    });
    return reservas.map((r) => this.aRespuesta(r, { incluirCliente: true }));
  }

  // =====================================================
  // DETALLE — El dueño de la reserva o el personal del bar
  // =====================================================
  async obtenerDetalle(
    idReserva: number,
    usuario: User,
  ): Promise<ReservaRespuestaDto> {
    const reserva = await this.reservaRepo.findOne({
      where: { idReserva },
      relations: ['user', 'agenda', 'historial', 'historial.usuario'],
    });

    const esDuenio = reserva?.user?.id === usuario.id;
    const esPersonal = this.esPersonal(usuario);

    // Si no es suya ni es personal, respondemos "no encontrada"
    // (así no se revela qué reservas existen)
    if (!reserva || (!esDuenio && !esPersonal)) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return this.aRespuesta(reserva, {
      incluirCliente: esPersonal,
      incluirHistorial: true,
    });
  }

  // =====================================================
  // Helpers
  // =====================================================

  private esPersonal(usuario: User): boolean {
    return ACCIONES_PERSONAL.some((accion) => usuario.tieneAccion(accion));
  }

  private aRespuesta(
    r: Reserva,
    opciones: { incluirCliente?: boolean; incluirHistorial?: boolean } = {},
  ): ReservaRespuestaDto {
    const respuesta: ReservaRespuestaDto = {
      idReserva: r.idReserva,
      cantidadPersonas: r.cantidadPersonas,
      estado: r.estado,
      fechaSolicitud: r.fechaSolicitud,
      // Regla de negocio: se puede cancelar si está Pendiente o Aceptada y el turno no empezó
      puedeCancelar:
        ESTADOS_QUE_OCUPAN_CUPO.includes(r.estado) &&
        !!r.agenda &&
        esFuturo(r.agenda.fecha, r.agenda.horario),
      turno: r.agenda
        ? {
            idAgenda: r.agenda.idAgenda,
            fecha: r.agenda.fecha,
            horario: r.agenda.horario,
          }
        : null,
    };

    if (opciones.incluirCliente && r.user) {
      respuesta.cliente = {
        id: r.user.id,
        nombre: r.user.Nombre,
        apellido: r.user.Apellido,
        correo: r.user.Correo,
        telefono: r.user.Telefono,
      };
    }

    if (opciones.incluirHistorial && r.historial) {
      respuesta.historial = [...r.historial]
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        .map((h) => ({
          estadoAnterior: h.estadoAnterior,
          estadoNuevo: h.estadoNuevo,
          fecha: h.fecha,
          usuario: h.usuario ? `${h.usuario.Nombre} ${h.usuario.Apellido}` : null,
        }));
    }

    return respuesta;
  }
}