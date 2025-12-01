import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/users.entity';
import { Grupo } from './grupos/grupos.entity';

@Injectable()
export class SeguridadService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Grupo)
    private grupoRepo: Repository<Grupo>,
  ) {}

  async obtenerUsuario(userId: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'grupos',
        'grupos.acciones',
        'grupos.acciones.formulario',
        'grupos.gruposPadres',
        'grupos.gruposPadres.acciones',
      ],
    });
  }

  async usuarioPuedeHacer(userId: number, accion: string): Promise<boolean> {
    const usuario = await this.obtenerUsuario(userId);
    return usuario?.tieneAccion(accion) || false;
  }

  async agregarGrupoAGrupo(grupoHijoId: number, grupoPadreId: number): Promise<Grupo> {
    const hijo = await this.grupoRepo.findOne({
      where: { id: grupoHijoId },
      relations: ['gruposPadres'],
    });
    if (!hijo?.gruposPadres) throw new Error('Grupo hijo no encontrado');
    const padre = await this.grupoRepo.findOne({ where: { id: grupoPadreId } });
    if (!padre) throw new Error('Grupo padre no encontrado');
    hijo.gruposPadres = [...(hijo.gruposPadres || []), padre];
    return this.grupoRepo.save(hijo);
  }
}