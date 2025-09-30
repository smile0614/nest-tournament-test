import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlayMatchDto } from './dto/play-match.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { MatchStatus, TournamentStatus } from '@prisma/client';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async playMatch(matchId: string): Promise<MatchResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        tournament: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status !== MatchStatus.PENDING) {
      throw new BadRequestException('Match is not in pending status');
    }

    if (match.tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Tournament is not in progress');
    }

    const winner = Math.random() < 0.5 ? match.player1 : match.player2;
    const loser = winner.id === match.player1.id ? match.player2 : match.player1;

    await this.prisma.$transaction(async (tx) => {
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.COMPLETED,
          winnerId: winner.id,
        },
      });

      await tx.matchResult.createMany({
        data: [
          {
            matchId,
            playerId: winner.id,
            points: 1,
          },
          {
            matchId,
            playerId: loser.id,
            points: 0,
          },
        ],
      });

      await tx.tournamentParticipant.updateMany({
        where: {
          tournamentId: match.tournamentId,
          userId: winner.id,
        },
        data: {
          points: {
            increment: 1,
          },
        },
      });

      await this.updateUserRatings(winner.id, loser.id);
      await this.checkTournamentCompletion(match.tournamentId);
    });

    const updatedMatch = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
    });

    return this.mapToResponseDto(updatedMatch);
  }

  async getMatch(matchId: string): Promise<MatchResponseDto> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.mapToResponseDto(match);
  }

  async getMatchesByTournament(tournamentId: string): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.match.findMany({
      where: { tournamentId },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' },
      ],
    });

    return matches.map(match => this.mapToResponseDto(match));
  }

  async getNextRoundMatches(tournamentId: string, currentRound: number): Promise<MatchResponseDto[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        tournamentId,
        round: currentRound + 1,
        status: MatchStatus.PENDING,
      },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
      orderBy: { matchNumber: 'asc' },
    });

    return matches.map(match => this.mapToResponseDto(match));
  }

  private async updateUserRatings(winnerId: string, loserId: string): Promise<void> {
    const K = 32;
    const winner = await this.prisma.user.findUnique({ where: { id: winnerId } });
    const loser = await this.prisma.user.findUnique({ where: { id: loserId } });

    if (!winner || !loser) return;

    const expectedWinner = 1 / (1 + Math.pow(10, (loser.rating - winner.rating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.rating - loser.rating) / 400));

    const newWinnerRating = Math.round(winner.rating + K * (1 - expectedWinner));
    const newLoserRating = Math.round(loser.rating + K * (0 - expectedLoser));

    await Promise.all([
      this.usersService.updateRating(winnerId, newWinnerRating),
      this.usersService.updateRating(loserId, newLoserRating),
    ]);
  }

  private async checkTournamentCompletion(tournamentId: string): Promise<void> {
    const pendingMatches = await this.prisma.match.count({
      where: {
        tournamentId,
        status: MatchStatus.PENDING,
      },
    });

    if (pendingMatches === 0) {
      await this.prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.COMPLETED,
          endDate: new Date(),
        },
      });

      await this.setFinalPositions(tournamentId);
    } else {
      await this.generateNextRound(tournamentId);
    }
  }

  private async setFinalPositions(tournamentId: string): Promise<void> {
    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      orderBy: { points: 'desc' },
    });

    for (let i = 0; i < participants.length; i++) {
      await this.prisma.tournamentParticipant.update({
        where: { id: participants[i].id },
        data: { position: i + 1 },
      });
    }
  }

  private async generateNextRound(tournamentId: string): Promise<void> {
    const currentRound = await this.prisma.match.findFirst({
      where: { tournamentId },
      orderBy: { round: 'desc' },
      select: { round: true },
    });

    if (!currentRound) return;

    const nextRound = currentRound.round + 1;
    const winners = await this.getRoundWinners(tournamentId, currentRound.round);

    if (winners.length < 2) return;

    const nextRoundMatches = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        nextRoundMatches.push({
          tournamentId,
          player1Id: winners[i],
          player2Id: winners[i + 1],
          round: nextRound,
          matchNumber: Math.floor(i / 2) + 1,
        });
      }
    }

    if (nextRoundMatches.length > 0) {
      await this.prisma.match.createMany({
        data: nextRoundMatches,
      });
    }
  }

  private async getRoundWinners(tournamentId: string, round: number): Promise<string[]> {
    const completedMatches = await this.prisma.match.findMany({
      where: {
        tournamentId,
        round,
        status: MatchStatus.COMPLETED,
      },
      select: { winnerId: true },
    });

    return completedMatches.map(match => match.winnerId).filter(Boolean) as string[];
  }

  private mapToResponseDto(match: any): MatchResponseDto {
    return {
      id: match.id,
      tournamentId: match.tournamentId,
      player1: {
        id: match.player1.id,
        email: match.player1.email,
        username: match.player1.username,
        rating: match.player1.rating,
        createdAt: match.player1.createdAt,
        updatedAt: match.player1.updatedAt,
      },
      player2: {
        id: match.player2.id,
        email: match.player2.email,
        username: match.player2.username,
        rating: match.player2.rating,
        createdAt: match.player2.createdAt,
        updatedAt: match.player2.updatedAt,
      },
      status: match.status,
      winner: match.winner ? {
        id: match.winner.id,
        email: match.winner.email,
        username: match.winner.username,
        rating: match.winner.rating,
        createdAt: match.winner.createdAt,
        updatedAt: match.winner.updatedAt,
      } : null,
      round: match.round,
      matchNumber: match.matchNumber,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }
}