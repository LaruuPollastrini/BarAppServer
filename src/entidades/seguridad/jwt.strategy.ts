import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SeguridadService } from './seguridad.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private seguridadService: SeguridadService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'tu-secreto-jwt',
    });
  }

  async validate(payload: any) {
    // Carga el usuario con todas sus relaciones
    const user = await this.seguridadService.obtenerUsuario(payload.sub);
    return user; // Se adjunta a request.user
  }
}