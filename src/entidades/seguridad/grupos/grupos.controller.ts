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
import { CreateGrupoDto, UpdateGrupoDto, GrupoResponseDto } from './grupos.dto';

@Controller('grupos')
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  async findAll(): Promise<GrupoResponseDto[]> {
    return this.gruposService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<GrupoResponseDto> {
    return this.gruposService.findOne(id);
  }

  @Post()
  async create(@Body() createGrupoDto: CreateGrupoDto): Promise<GrupoResponseDto> {
    return this.gruposService.create(createGrupoDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrupoDto: UpdateGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.gruposService.update(id, updateGrupoDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.gruposService.remove(id);
  }
}
