import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reserva } from './reserva.entity';
import { Repository } from 'typeorm';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Agenda } from '../agenda/agenda.entity';

@Injectable()
export class ReservaService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Agenda)
    private agendaRepo: Repository<Agenda>,
  ) {}

  // =====================
  // CREAR RESERVA
  // =====================
  async crearReserva(userId: number, agendaId: number, personas: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const agenda = await this.agendaRepo.findOne({ where: { idAgenda: agendaId } });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!agenda) throw new NotFoundException('Fecha/horario no disponible');

    const reserva = this.reservaRepo.create({
      user,
      agenda,
      cantidadPersonas: personas,
      estado: 'Pendiente',
    });

    return this.reservaRepo.save(reserva);
  }

  // =====================
  // OBTENER TODAS
  // =====================
  async getAll() {
    return this.reservaRepo.find({
      relations: ['user', 'agenda'],  
    });
  }

  // =====================
  // POR USUARIO
  // =====================
  async getByCliente(userId: number) {
    return this.reservaRepo.find({
      where: { user: { id: userId } }, 
      relations: ['agenda', 'user'],   
    });
  }

  // =====================
  // POR ID
  // =====================
  async getById(id: number) {
    return this.reservaRepo.findOne({
      where: { idReserva: id },
      relations: ['agenda', 'user'], 
    });
  }

  // =====================
  // ELIMINAR
  // =====================
  async eliminar(id: number) {
    return this.reservaRepo.delete(id);
  }
}

