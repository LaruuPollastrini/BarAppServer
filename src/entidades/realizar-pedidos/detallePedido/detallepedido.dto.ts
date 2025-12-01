export interface DetallesPedidoDto {
    id?: number;
    cantidad: number;
    precioUnitario?: number;
    producto: {
        id: number; // ID del producto
    }
    pedidoId?: number;
}