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
import { AccionesService } from './acciones.service';
import { CreateAccionDto, UpdateAccionDto, AccionResponseDto } from './acciones.dto';

@Controller('acciones')
export class AccionesController {
  constructor(private readonly accionesService: AccionesService) {}

  @Get()
  async findAll(): Promise<AccionResponseDto[]> {
    return this.accionesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AccionResponseDto> {
    return this.accionesService.findOne(id);
  }

  @Post()
  async create(@Body() createAccionDto: CreateAccionDto): Promise<AccionResponseDto> {
    return this.accionesService.create(createAccionDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccionDto: UpdateAccionDto,
  ): Promise<AccionResponseDto> {
    return this.accionesService.update(id, updateAccionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.accionesService.remove(id);
  }
}

