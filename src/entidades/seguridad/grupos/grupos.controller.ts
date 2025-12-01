import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GruposService } from './grupos.service';
import { CreateGrupoDto, UpdateGrupoDto } from './grupos.dto';
import { Grupo } from './grupos.entity';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  async findAll(): Promise<Grupo[]> {
    return this.gruposService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Grupo> {
    return this.gruposService.findOne(id);
  }

  @Post()
  async create(@Body() createGrupoDto: CreateGrupoDto): Promise<Grupo> {
    return this.gruposService.create(createGrupoDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrupoDto: UpdateGrupoDto,
  ): Promise<Grupo> {
    return this.gruposService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.gruposService.remove(id);
  }
}
