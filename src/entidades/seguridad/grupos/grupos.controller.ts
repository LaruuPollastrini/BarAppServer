import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GruposService, RequestUser } from './grupos.service';
import { CreateGrupoDto, UpdateGrupoDto, GrupoResponseDto } from './grupos.dto';

@Controller('grupos')
@UseGuards(AuthGuard('jwt'))
export class GruposController {
  constructor(private readonly gruposService: GruposService) {}

  @Get()
  async findAll(
    @Request() req: { user: RequestUser },
  ): Promise<GrupoResponseDto[]> {
    return this.gruposService.findAll(req.user);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: RequestUser },
  ): Promise<GrupoResponseDto> {
    return this.gruposService.findOne(id, req.user);
  }

  @Post()
  async create(
    @Body() createGrupoDto: CreateGrupoDto,
  ): Promise<GrupoResponseDto> {
    return this.gruposService.create(createGrupoDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrupoDto: UpdateGrupoDto,
    @Request() req: { user: RequestUser },
  ): Promise<GrupoResponseDto> {
    return this.gruposService.update(id, updateGrupoDto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.gruposService.remove(id);
  }

  @Post(':nombre/assign-all-actions')
  async assignAllActionsToGrupo(
    @Param('nombre') nombre: string,
  ): Promise<GrupoResponseDto> {
    return this.gruposService.assignAllPredefinedActionsToGrupo(nombre);
  }
}
