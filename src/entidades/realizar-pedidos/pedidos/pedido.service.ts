import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedidos } from './pedidos.entity';
import { DetallesPedido } from '../detallePedido/detallespedido.entity';
import { User } from 'src/entidades/seguridad/users/users.entity';
import { Mesa } from '../mesa/mesas.entity';
import { Producto } from '../productos/productos.entity';
import { Estados } from './pedido.dto';
import { DetallesPedidoDto } from '../detallePedido/detallepedido.dto';

@Injectable()
export class PedidoService {
  constructor(
    //agregarlos en modulos
    @InjectRepository(Pedidos)
    private pedidosRepository: Repository<Pedidos>,
     @InjectRepository(User)
    private usuarioRepository: Repository<User>,
     @InjectRepository(Mesa)
    private mesaRepository: Repository<Mesa>,
     @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(DetallesPedido)
    private detallesPedidoRepository: Repository<DetallesPedido>,
  ) {}

  async findAll(): Promise<Pedidos[]> {
    const pedidos = await this.pedidosRepository.find({
  relations: ['user', 'mesa', 'ticket', 'detallespedido', 'detallespedido.producto'],
});
    return pedidos;
  }

  findOne(id: number): Promise< Pedidos | null> {
    return this.pedidosRepository.findOneBy({ idpedido: id });
  }

  async agregar(idusuario:number, detallesPedido:DetallesPedidoDto[],idmesa:number ): Promise<void> {
    try {
      const usuario = await this.usuarioRepository.findOneBy({ id: idusuario });
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }
    const mesa = await this.mesaRepository.findOneBy({ idmesa: idmesa });
    if (!mesa) {
      throw new Error('Mesa no encontrada');
    }
    if (!detallesPedido.length) {
      throw new Error('No se han agregado detalles al pedido');
    }
    const detalles: DetallesPedido[] = [];
    for (let i = 0; i < detallesPedido.length; i++) {
      const dp = detallesPedido[i];
      const prod = await this.productoRepository.findOneBy({ id: dp.producto.id })
        if (!prod) {
          throw new Error(`Producto con ID ${dp.producto.id} no encontrado`);
        }
        const detalle = {
        cantidad: dp.cantidad,
        precioUnitario: prod.precio,
        producto: dp.producto as Producto
      } as DetallesPedido;
      detalles.push(detalle);
    }

    const pedido: Omit<Pedidos, 'idpedido'|'fecha'|'ticket'> = {
      user: usuario,
      detallespedido: detalles,
      mesa,
      estado: Estados.Pendiente,
    }
    console.log(pedido)
    const pedidoCreado = await this.pedidosRepository.create(pedido);
    await this.pedidosRepository.save(pedidoCreado);
    console.log(`Pedido creado con ID: ${pedidoCreado.idpedido}`);
    } catch (error) {
      console.log(error);
    }
}
async modificar(id: number, detallePedido: DetallesPedidoDto[]): Promise<void> {
  try {
    const pedidoExistente = await this.pedidosRepository.findOne({
      where: { idpedido: id },
      relations: ['detallespedido', 'mesa', 'user', 'ticket'],
    });

    if (!pedidoExistente) {
      throw new Error('Pedido no encontrado');
    }

    
    await this.detallesPedidoRepository.delete({ pedido: { idpedido: id } });

    const detallesActualizados: DetallesPedido[] = [];
    for (let i = 0; i < detallePedido.length; i++) {
      const dp = detallePedido[i];
      const prod = await this.productoRepository.findOneBy({ id: dp.producto.id })
        if (!prod) {
          throw new Error(`Producto con ID ${dp.producto.id} no encontrado`);
        }
        const detalle = {
        cantidad: dp.cantidad,
        precioUnitario: prod.precio,
        producto: dp.producto as Producto,
        pedido: pedidoExistente,
      } as DetallesPedido;
      detallesActualizados.push(detalle);
    }
    
    pedidoExistente.detallespedido = detallesActualizados;

    
    await this.pedidosRepository.save(pedidoExistente);

  } catch (error) {
    console.log('Error modificando pedido:', error.message);
    throw error;
  }
}

  async actualizarEstado(id: number, estado: Estados.Rechazado | Estados.Confirmado): Promise<void> {
    try {
      const pedidoExistente = await this.pedidosRepository.findOneBy({ idpedido: id });
    if (!pedidoExistente) {
      throw new Error('Pedido no encontrado');
    }
    await this.pedidosRepository.update({idpedido: id}, {...pedidoExistente, estado});
    } catch (error) {
      console.log(error);
    }
  }

}

