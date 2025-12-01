import { Body, Controller, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { Producto } from "./productos.entity"
import { ProductosService } from "./productos.service";

  @Controller("productos")
  export class ProductoController {
    constructor(private readonly productoService: ProductosService) {}
@Post("/")
  async agregarProducto(@Body("nombre") nombre: string, @Body("descripcion") descripcion: string, @Body("precio") precio: number
): Promise<string> {
    await this.productoService.agregar(nombre, descripcion, precio);
    return `El pedido ha sido agregado correctamente`;
  }

  @Put("/")
  async modificarPedido(@Body() producto: Producto
): Promise<string> {
    await this.productoService.modificar(producto);
    return `Pedido con ID ${producto.id} actualizado correctamente`;
  }

    @Delete("/:id")
  async eliminarProducto(@Param("id") id: number
): Promise<string> {
    await this.productoService.remove(id);
    return `Pedido con ID ${id} eliminado correctamente`;
  }
   @Get("/")
  async listarProductosDisponibles(): Promise<string> {
    const productos = await this.productoService.findAllAvailable();
    return JSON.stringify(productos);
  }

  @Get("/:id")
  async listarProductosID(@Param("id") id:number): Promise<string> {
    const productos = await this.productoService.findOne(id);
    return JSON.stringify(productos);
  }
}