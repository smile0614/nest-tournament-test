import { ApiProperty } from '@nestjs/swagger';
import { TournamentStatus } from '@prisma/client';

export class TournamentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TournamentStatus })
  status: TournamentStatus;

  @ApiProperty()
  maxPlayers: number;

  @ApiProperty()
  currentPlayers: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}