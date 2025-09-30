import { ApiProperty } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class MatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tournamentId: string;

  @ApiProperty({ type: UserResponseDto })
  player1: UserResponseDto;

  @ApiProperty({ type: UserResponseDto })
  player2: UserResponseDto;

  @ApiProperty({ enum: MatchStatus })
  status: MatchStatus;

  @ApiProperty({ type: UserResponseDto, nullable: true })
  winner: UserResponseDto | null;

  @ApiProperty()
  round: number;

  @ApiProperty()
  matchNumber: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}