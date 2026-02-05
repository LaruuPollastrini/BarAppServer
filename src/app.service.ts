import { Injectable, OnModuleInit } from '@nestjs/common';
import { AccionesService } from './entidades/seguridad/acciones/acciones.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly accionesService: AccionesService) {}

  async onModuleInit() {
    // Synchronize predefined actions on application startup
    try {
      await this.accionesService.synchronizePredefinedActions();
      console.log('✅ Predefined actions synchronized successfully');
    } catch (error) {
      console.error('❌ Error synchronizing predefined actions:', error);
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
