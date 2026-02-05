import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Constante que identifica la metadata del decorador
export const ACCIONES_KEY = 'acciones';

@Injectable()
export class AccionesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lee las acciones requeridas desde el decorador @RequiereAcciones
    const accionesRequeridas = this.reflector.getAllAndOverride<string[]>(
      ACCIONES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Si no hay acciones requeridas, permite el acceso
    if (!accionesRequeridas || accionesRequeridas.length === 0) {
      return true;
    }

    // 3. Obtiene el usuario del request (viene del AuthGuard/JWT)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 4. Si no hay usuario autenticado, rechaza
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // 5. Early return: si el usuario pertenece al grupo Admin, tiene permiso para todo
    if (
      user.grupos?.some(
        (g: { nombre?: string }) => g.nombre?.trim().toLowerCase() === 'admin',
      )
    ) {
      return true;
    }

    // 6. Verifica que el usuario tenga TODAS las acciones requeridas
    const tienePermisos = accionesRequeridas.every((accion) =>
      user.tieneAccion(accion),
    );

    // 7. Si no tiene permisos, lanza excepción con detalle
    if (!tienePermisos) {
      throw new ForbiddenException(
        `No tienes permisos suficientes. Se requieren: ${accionesRequeridas.join(', ')}`,
      );
    }

    return true;
  }
}
