import { Module, Global } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';
import { redisConfig } from '../../config/redis.config';
import { RedisService } from './redis.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [
    LoggerModule,
    NestRedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        database: redisConfig.db || 0,
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService, NestRedisModule],
})
export class RedisModule {}