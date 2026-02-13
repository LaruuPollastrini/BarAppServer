import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Convierte errores no controlados (Error) en respuestas HTTP con mensaje amigable.
 * Así el frontend recibe status 4xx y response.data.message en lugar de 500 "Internal Server Error".
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message: string | string[] }).message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      status = this.getStatusFromMessage(message);
      this.logger.warn(`Error de negocio convertido a ${status}: ${message}`);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error interno del servidor';
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private getStatusFromMessage(message: string): number {
    const m = message.toLowerCase();
    if (m.includes('ya existe') || m.includes('duplicad')) {
      return HttpStatus.CONFLICT; // 409
    }
    if (
      m.includes('no encontrad') ||
      m.includes('no existe') ||
      m.includes('no encontrado')
    ) {
      return HttpStatus.NOT_FOUND; // 404
    }
    return HttpStatus.BAD_REQUEST; // 400 para validación/regla de negocio
  }
}
