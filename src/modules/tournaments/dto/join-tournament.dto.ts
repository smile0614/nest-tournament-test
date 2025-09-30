import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinTournamentDto {
  @ApiProperty({ example: 'tournament_id_here' })
  @IsString()
  tournamentId: string;
}