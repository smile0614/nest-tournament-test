import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({ status: 201, description: 'Tournament created successfully', type: TournamentResponseDto })
  create(@Body() createTournamentDto: CreateTournamentDto): Promise<TournamentResponseDto> {
    return this.tournamentsService.create(createTournamentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tournaments with pagination' })
  @ApiResponse({ status: 200, description: 'Tournaments retrieved successfully' })
  findAll(@Query() pagination: PaginationDto) {
    return this.tournamentsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID' })
  @ApiResponse({ status: 200, description: 'Tournament retrieved successfully', type: TournamentResponseDto })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  findOne(@Param('id') id: string): Promise<TournamentResponseDto> {
    return this.tournamentsService.findOne(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a tournament' })
  @ApiResponse({ status: 200, description: 'Successfully joined tournament' })
  @ApiResponse({ status: 400, description: 'Cannot join tournament' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  @ApiResponse({ status: 409, description: 'Already in tournament' })
  joinTournament(@Param('id') id: string, @Body() joinTournamentDto: JoinTournamentDto) {
    const userId = 'user-id-from-token';
    return this.tournamentsService.joinTournament(id, userId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a tournament' })
  @ApiResponse({ status: 200, description: 'Tournament started successfully' })
  @ApiResponse({ status: 400, description: 'Cannot start tournament' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  startTournament(@Param('id') id: string) {
    return this.tournamentsService.startTournament(id);
  }

  @Get(':id/rankings')
  @ApiOperation({ summary: 'Get tournament rankings' })
  @ApiResponse({ status: 200, description: 'Tournament rankings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  getRankings(@Param('id') id: string) {
    return this.tournamentsService.getTournamentRankings(id);
  }

  @Get(':id/matches')
  @ApiOperation({ summary: 'Get tournament matches' })
  @ApiResponse({ status: 200, description: 'Tournament matches retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  getMatches(@Param('id') id: string) {
    return this.tournamentsService.getTournamentMatches(id);
  }
}