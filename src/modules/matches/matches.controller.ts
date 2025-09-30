import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { PlayMatchDto } from './dto/play-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post('play')
  @ApiOperation({ summary: 'Play a match (simulate with random winner)' })
  @ApiResponse({ status: 200, description: 'Match played successfully', type: MatchResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot play match' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  playMatch(@Body() playMatchDto: PlayMatchDto): Promise<MatchResponseDto> {
    return this.matchesService.playMatch(playMatchDto.matchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  @ApiResponse({ status: 200, description: 'Match retrieved successfully', type: MatchResponseDto })
  @ApiResponse({ status: 404, description: 'Match not found' })
  getMatch(@Param('id') id: string): Promise<MatchResponseDto> {
    return this.matchesService.getMatch(id);
  }

  @Get('tournament/:tournamentId')
  @ApiOperation({ summary: 'Get all matches for a tournament' })
  @ApiResponse({ status: 200, description: 'Matches retrieved successfully', type: [MatchResponseDto] })
  getMatchesByTournament(@Param('tournamentId') tournamentId: string): Promise<MatchResponseDto[]> {
    return this.matchesService.getMatchesByTournament(tournamentId);
  }

  @Get('tournament/:tournamentId/next-round')
  @ApiOperation({ summary: 'Get next round matches for a tournament' })
  @ApiResponse({ status: 200, description: 'Next round matches retrieved successfully', type: [MatchResponseDto] })
  getNextRoundMatches(
    @Param('tournamentId') tournamentId: string,
    @Query('round') round: string,
  ): Promise<MatchResponseDto[]> {
    const currentRound = parseInt(round, 10);
    return this.matchesService.getNextRoundMatches(tournamentId, currentRound);
  }
}