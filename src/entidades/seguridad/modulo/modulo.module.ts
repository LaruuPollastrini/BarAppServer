import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Modulo } from './modulo.entity';
import { ModuloService } from './modulo.service';
import { ModuloController } from './modulo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Modulo])],
  providers: [ModuloService],
  controllers: [ModuloController],
  exports: [ModuloService],
})
export class ModuloModule {}

