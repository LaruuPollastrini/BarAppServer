import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mesa } from './mesas.entity';
import { MesaService } from './mesa.service';
import { MesaController } from './mesa.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mesa])],
  providers: [MesaService],
  controllers: [MesaController],
})
export class MesaModule {}