import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function getRedis(): Redis {
    if (client) return client;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
        throw new Error("Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel environment variables.");
    }
    client = new Redis({ url, token });
    return client;
}

export function isRedisConfigured(): boolean {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
