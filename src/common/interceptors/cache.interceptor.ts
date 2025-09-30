import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    return next.handle().pipe(
      tap(result => {
        this.cacheService.set(cacheKey, result, 300);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, query, params } = request;
    return `${method}:${url}:${JSON.stringify({ ...query, ...params })}`;
  }
}