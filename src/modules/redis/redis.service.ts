import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { AppLoggerService } from '../logger/logger.service';


@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private isConnected: boolean = false;
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    await this.setupRedisConnection();
  }

  async onModuleDestroy() {
    try {
      await this.redis.quit();
      this.logger.log('Redis connection closed gracefully', 'RedisService');
    } catch (error) {
      this.logger.error(`Error closing Redis connection: ${error.message}`, 'RedisService');
    }
  }

  private async setupRedisConnection() {
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Successfully connected to Redis', 'RedisService');
    });

    this.redis.on('ready', () => {
      this.isConnected = true;
      this.logger.log('Redis client is ready', 'RedisService');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      this.logger.error(`Redis connection error: ${error.message}`, 'RedisService');
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      this.logger.warn('Redis connection closed', 'RedisService');
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Attempting to reconnect to Redis...', 'RedisService');
    });

    // Test connection
    try {
      await this.testConnection();
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`, 'RedisService');
      throw error;
    }
  }

  private async testConnection(): Promise<void> {
    try {
      await this.redis.ping();
      this.logger.log('Redis connection test successful (PING-PONG)', 'RedisService');
      
      // Test write and read
      const testKey = 'connection_test';
      await this.redis.set(testKey, 'test_value', 'EX', 5);
      const testValue = await this.redis.get(testKey);
      
      if (testValue === 'test_value') {
        this.logger.log('Redis write/read test successful', 'RedisService');
      } else {
        throw new Error('Redis write/read test failed');
      }
    } catch (error) {
      this.logger.error(`Redis connection test failed: ${error.message}`, 'RedisService');
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Error getting data from Redis: ${error.message}`, 'RedisService.get');
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.set(key, serializedValue, 'EX', ttl);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting data in Redis: ${error.message}`, 'RedisService.set');
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting data from Redis: ${error.message}`, 'RedisService.del');
    }
  }
}