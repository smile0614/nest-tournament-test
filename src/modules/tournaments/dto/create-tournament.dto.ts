import { IsString, IsOptional, IsInt, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty({ example: 'Spring Championship 2024' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Annual spring tournament for all players' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 16, minimum: 4, maximum: 128 })
  @IsInt()
  @Min(4)
  @Max(128)
  maxPlayers: number;

  @ApiPropertyOptional({ example: '2024-03-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}