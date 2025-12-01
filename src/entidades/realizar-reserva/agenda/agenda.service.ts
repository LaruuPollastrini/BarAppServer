import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agenda } from './agenda.entity';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Agenda)
    private agendaRepo: Repository<Agenda>,
  ) {}

  // ======================
  // 1) Publicar fecha + horario
  // ======================
  async publicar(fecha: Date, horario: string) {
    const agenda = this.agendaRepo.create({ fecha, horario });
    return this.agendaRepo.save(agenda);
  }

  // ======================
  // 2) Listar todo (Admin)
  // ======================
  async listarTodo() {
    return this.agendaRepo.find();
  }

  // ======================
  // 3) Listar fechas disponibles (Cliente)
  // ======================
  async listarDisponibles() {
    return this.agendaRepo.find();
  }

  // ======================
  // 4) Eliminar disponibilidad
  // ======================
  async eliminar(idAgenda: number) {
    const item = await this.agendaRepo.findOne({
      where: { idAgenda },
    });

    if (!item) throw new NotFoundException('Disponibilidad no encontrada');

    return this.agendaRepo.delete(idAgenda);
  }
}
