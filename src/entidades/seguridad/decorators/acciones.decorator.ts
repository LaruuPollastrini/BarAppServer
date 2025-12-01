import { Req, SetMetadata } from '@nestjs/common';
const ACCIONES_KEY = 'acciones';

export const RequiereAcciones = (...acciones: string[]) => SetMetadata(ACCIONES_KEY, acciones);