import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MesaService } from './mesa.service';
import { Mesa } from './mesas.entity';


@Controller("mesas")
export class MesaController {
  constructor(private readonly mesaService: MesaService) {}

  @Get("/:id")
  async obtenerMesas(@Param("id") id: number
): Promise<string> {
    await this.mesaService.remove(id);//agregar mesa (viaja por el body), modificar y eliminar mesa
    return `Mesa con ID ${id} eliminada correctamente`;
  }
  @Post("/")
    async agregar(@Body("numero") numero: number
  ): Promise<string> {
      await this.mesaService.agregar(numero);
      return `la mesa ha sido agregado correctamente`;
    }
  @Put("/")
      async modificarMesa(@Body() mesa: Mesa
    ): Promise<string> {
        await this.mesaService.modificar(mesa);
        return `Mesa con ID ${mesa.idmesa} actualizado correctamente`;
      }
    
  @Delete("/:id")
      async eliminarProducto(@Param("id") id: number
    ): Promise<string> {
        await this.mesaService.remove(id);
        return `Mesa con ID ${id} eliminado correctamente`;
      }

      @Get("/")
  async listarMesas(): Promise<string> {
    const mesa = await this.mesaService.findAll();
    return JSON.stringify(mesa);
  }
}

// para agregar la data viaja por el body, usar @Body() en el controlador
// para modificar la data viaja por el body, usar @Body() en el controlador