// src/config/redis.config.ts
import { registerAs } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export default registerAs(
  'redis',
  (): RedisOptions => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
    // TLS for production (AWS ElastiCache, Upstash, Redis Cloud)
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,

    // ── Reconnection strategy (industry standard) ──
    retryStrategy(times: number) {
      if (times > 10) return null; // Give up after 10 attempts
      return Math.min(times * 100, 3000); // Exponential backoff, max 3s
    },

    // ── Connection pool settings ──
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,

    // ── Timeouts ──
    connectTimeout: 10_000, // 10s
    commandTimeout: 5_000, // 5s per command
  }),
);
