import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MesaService } from './mesa.service';
import { Mesa } from './mesas.entity';
import { AccionesGuard } from '../../seguridad/guards/acciones.guard';
import { RequiereAcciones } from '../../seguridad/decorators/acciones.decorator';

@Controller('mesas')
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Get('/')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Ver Pedidos')
  async listarMesas(): Promise<string> {
    const mesa = await this.mesaService.findAll();
    return JSON.stringify(mesa);
  }

  @Get('/numero/:numero')
  async obtenerMesaPorNumero(@Param('numero') numero: number): Promise<string> {
    const mesa = await this.mesaService.findByNumero(numero);
    if (!mesa) {
      return JSON.stringify(null);
    }
    return JSON.stringify(mesa);
  }

  @Post('/')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Ver Pedidos')
  async agregar(@Body('numero') numero: number): Promise<string> {
    await this.mesaService.agregar(numero);
    return `la mesa ha sido agregado correctamente`;
  }

  @Put('/')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Ver Pedidos')
  async modificarMesa(@Body() mesa: Mesa): Promise<string> {
    await this.mesaService.modificar(mesa);
    return `Mesa con ID ${mesa.idmesa} actualizado correctamente`;
  }

  @Put('/:id/estado')
  @UseGuards(AuthGuard('jwt'))
  async actualizarEstado(
    @Param('id') id: number,
    @Body('estaAbierta') estaAbierta: boolean,
    @Req() req: { user: { tieneAccion: (a: string) => boolean } },
  ): Promise<string> {
    if (estaAbierta && !req.user.tieneAccion('Mesas.Abrir Mesa')) {
      throw new ForbiddenException('No tienes permiso para abrir mesas');
    }
    if (!estaAbierta && !req.user.tieneAccion('Mesas.Cerrar Mesa')) {
      throw new ForbiddenException('No tienes permiso para cerrar mesas');
    }
    await this.mesaService.updateStatus(id, estaAbierta);
    return `Estado de la mesa actualizado correctamente`;
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'), AccionesGuard)
  @RequiereAcciones('Mesas.Eliminar Mesa')
  async eliminarProducto(@Param('id') id: number): Promise<string> {
    await this.mesaService.remove(id);
    return `Mesa con ID ${id} eliminado correctamente`;
  }

  /**
   * Verify a code for a table (public endpoint for customers)
   */
  @Post('/verificar-codigo')
  async verificarCodigo(
    @Body('numeroMesa') numeroMesa: number,
    @Body('codigo') codigo: string,
  ): Promise<{ valid: boolean; message: string }> {
    const isValid = await this.mesaService.verifyCode(numeroMesa, codigo);
    if (isValid) {
      return { valid: true, message: 'Código verificado correctamente' };
    }
    return { valid: false, message: 'Código incorrecto o mesa cerrada' };
  }
}
