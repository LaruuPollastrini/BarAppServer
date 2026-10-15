import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Reserva } from '../reservas/reserva.entity';
import { ReservaHistorial } from '../reservas/reserva-historial.entity';
import { ReservaService } from '../reservas/reserva.service';
import { ReservaRespuestaDto } from '../reservas/reserva.dto';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { EstadoReservaFactory } from './estado-reserva.factory';
import { esFuturo, hoy } from '../fechas.util';

type Transicion = 'aceptar' | 'rechazar' | 'cancelar' | 'cerrar';

@Injectable()
export class EstadoService {
  constructor(
    private dataSource: DataSource,
    private reservaService: ReservaService,
  ) {}

  // ================================================
  // GESTIÓN — Aceptar
  // ================================================
  aceptar(idReserva: number, usuario: User): Promise<ReservaRespuestaDto> {
    return this.transicionar(idReserva, usuario, 'aceptar', (reserva) => {
      if (!esFuturo(reserva.agenda.fecha, reserva.agenda.horario)) {
        throw new BadRequestException(
          'El turno de esta reserva ya pasó; no se puede aceptar',
        );
      }
    });
  }

  // ================================================
  // GESTIÓN — Rechazar
  // ================================================
  rechazar(idReserva: number, usuario: User): Promise<ReservaRespuestaDto> {
    return this.transicionar(idReserva, usuario, 'rechazar');
  }

  // ================================================
  // RECEPCIÓN — Cerrar (el cliente asistió)
  // ================================================
  cerrar(idReserva: number, usuario: User): Promise<ReservaRespuestaDto> {
    return this.transicionar(idReserva, usuario, 'cerrar', (reserva) => {
      if (reserva.agenda.fecha > hoy()) {
        throw new BadRequestException(
          'Solo se puede cerrar una reserva a partir del día del turno',
        );
      }
    });
  }

  // ================================================
  // CLIENTE — Cancelar mi reserva
  // ================================================
  cancelarMia(idReserva: number, usuario: User): Promise<ReservaRespuestaDto> {
    return this.transicionar(
      idReserva,
      usuario,
      'cancelar',
      (reserva) => {
        if (!esFuturo(reserva.agenda.fecha, reserva.agenda.horario)) {
          throw new BadRequestException(
            'El turno ya comenzó; la reserva no se puede cancelar',
          );
        }
      },
      true, // solo el dueño de la reserva puede cancelarla
    );
  }

  // ================================================
  // Lógica común de todas las transiciones, en este orden:
  // 1) bloquea la reserva
  // 2) si corresponde, verifica que sea del usuario
  // 3) aplica el State (¿la transición es válida para el estado actual?)
  // 4) valida las reglas de fecha
  // 5) guarda el nuevo estado y registra el historial
  // ================================================
  private async transicionar(
    idReserva: number,
    usuario: User,
    transicion: Transicion,
    validar?: (reserva: Reserva) => void,
    soloDuenio = false,
  ): Promise<ReservaRespuestaDto> {
    await this.dataSource.transaction(async (manager) => {
      // Bloqueo: evita que dos personas cambien la misma reserva a la vez
      const bloqueada = await manager.findOne(Reserva, {
        where: { idReserva },
        lock: { mode: 'pessimistic_write' },
      });
      if (!bloqueada) throw new NotFoundException('Reserva no encontrada');

      const reserva = await manager.findOne(Reserva, {
        where: { idReserva },
        relations: ['user', 'agenda'],
      });
      if (!reserva) throw new NotFoundException('Reserva no encontrada');

      // No se revela si existe una reserva ajena: se responde "no encontrada"
      if (soloDuenio && reserva.user?.id !== usuario.id) {
        throw new NotFoundException('Reserva no encontrada');
      }

      const estadoAnterior = reserva.estado;
      const estado = EstadoReservaFactory.crear(reserva);
      estado[transicion](); // ← el patrón State decide si la transición es válida

      // Reglas de fecha (si fallan, la transacción se deshace y no se guarda nada)
      if (validar) validar(reserva);

      await manager.update(Reserva, { idReserva }, { estado: reserva.estado });

      await manager.save(
        manager.create(ReservaHistorial, {
          reserva: { idReserva } as Reserva,
          estadoAnterior,
          estadoNuevo: reserva.estado,
          usuario: { id: usuario.id } as User,
        }),
      );
    });

    return this.reservaService.obtenerDetalle(idReserva, usuario);
  }
}