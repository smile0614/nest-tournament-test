import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlayMatchDto {
  @ApiProperty({ example: 'match_id_here' })
  @IsString()
  matchId: string;
}