import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.del('*');
  }

  async getTournamentRankings(tournamentId: string) {
    return this.get(`tournament:${tournamentId}:rankings`);
  }

  async setTournamentRankings(tournamentId: string, rankings: any[], ttl = 300) {
    await this.set(`tournament:${tournamentId}:rankings`, rankings, ttl);
  }

  async invalidateTournamentCache(tournamentId: string) {
    await this.del(`tournament:${tournamentId}:rankings`);
    await this.del(`tournament:${tournamentId}:matches`);
  }

  async getTopPlayers(limit: number) {
    return this.get(`top-players:${limit}`);
  }

  async setTopPlayers(limit: number, players: any[], ttl = 600) {
    await this.set(`top-players:${limit}`, players, ttl);
  }

  async invalidateUserCache(userId: string) {
    await this.del('top-players:10');
    await this.del('top-players:20');
    await this.del('top-players:50');
  }
}