import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { JoinTournamentDto } from './dto/join-tournament.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { TournamentStatus, MatchStatus } from '@prisma/client';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class TournamentsService {
  constructor(
    private prisma: PrismaService,
    private matchesService: MatchesService,
  ) {}

  async create(createTournamentDto: CreateTournamentDto): Promise<TournamentResponseDto> {
    const { name, description, maxPlayers, startDate } = createTournamentDto;

    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        description,
        maxPlayers,
        startDate: startDate ? new Date(startDate) : null,
      },
    });

    return this.mapToResponseDto(tournament);
  }

  async findAll(pagination: PaginationDto): Promise<{ tournaments: TournamentResponseDto[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tournament.count(),
    ]);

    return {
      tournaments: tournaments.map(tournament => this.mapToResponseDto(tournament)),
      total,
    };
  }

  async findOne(id: string): Promise<TournamentResponseDto> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return this.mapToResponseDto(tournament);
  }

  async joinTournament(tournamentId: string, userId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException('Cannot join tournament that is not upcoming');
    }

    if (tournament.currentPlayers >= tournament.maxPlayers) {
      throw new BadRequestException('Tournament is full');
    }

    const existingParticipant = await this.prisma.tournamentParticipant.findUnique({
      where: {
        userId_tournamentId: {
          userId,
          tournamentId,
        },
      },
    });

    if (existingParticipant) {
      throw new ConflictException('User is already in this tournament');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tournamentParticipant.create({
        data: {
          userId,
          tournamentId,
        },
      });

      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          currentPlayers: {
            increment: 1,
          },
        },
      });
    });
  }

  async startTournament(tournamentId: string): Promise<void> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.status !== TournamentStatus.UPCOMING) {
      throw new BadRequestException('Tournament is not in upcoming status');
    }

    if (tournament.currentPlayers < 2) {
      throw new BadRequestException('Tournament needs at least 2 players to start');
    }

    const playerCount = tournament.currentPlayers;
    if (!this.isPowerOfTwo(playerCount)) {
      throw new BadRequestException('Tournament needs a power of 2 number of players for elimination bracket');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: TournamentStatus.IN_PROGRESS,
          startDate: new Date(),
        },
      });

      await this.generateMatches(tournamentId, tournament.participants.map(p => p.userId));
    });
  }

  async getTournamentRankings(tournamentId: string): Promise<any[]> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const participants = await this.prisma.tournamentParticipant.findMany({
      where: { tournamentId },
      include: {
        user: true,
      },
      orderBy: [
        { position: 'asc' },
        { points: 'desc' },
      ],
    });

    return participants.map((participant, index) => ({
      position: participant.position || index + 1,
      user: {
        id: participant.user.id,
        username: participant.user.username,
        rating: participant.user.rating,
      },
      points: participant.points,
    }));
  }

  async getTournamentMatches(tournamentId: string): Promise<any[]> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

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

    return matches.map(match => ({
      id: match.id,
      player1: {
        id: match.player1.id,
        username: match.player1.username,
        rating: match.player1.rating,
      },
      player2: {
        id: match.player2.id,
        username: match.player2.username,
        rating: match.player2.rating,
      },
      winner: match.winner ? {
        id: match.winner.id,
        username: match.winner.username,
        rating: match.winner.rating,
      } : null,
      status: match.status,
      round: match.round,
      matchNumber: match.matchNumber,
      createdAt: match.createdAt,
    }));
  }

  private async generateMatches(tournamentId: string, playerIds: string[]): Promise<void> {
    const shuffledPlayers = this.shuffleArray([...playerIds]);
    const totalRounds = Math.log2(shuffledPlayers.length);
    
    const firstRoundMatches = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      firstRoundMatches.push({
        tournamentId,
        player1Id: shuffledPlayers[i],
        player2Id: shuffledPlayers[i + 1],
        round: 1,
        matchNumber: Math.floor(i / 2) + 1,
      });
    }

    await this.prisma.match.createMany({
      data: firstRoundMatches,
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  private mapToResponseDto(tournament: any): TournamentResponseDto {
    return {
      id: tournament.id,
      name: tournament.name,
      description: tournament.description,
      status: tournament.status,
      maxPlayers: tournament.maxPlayers,
      currentPlayers: tournament.currentPlayers,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      createdAt: tournament.createdAt,
      updatedAt: tournament.updatedAt,
    };
  }
}