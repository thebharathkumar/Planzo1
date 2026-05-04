import { getRedis } from "./redis";

export async function cached<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
    const redis = getRedis();
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) return hit;
    const value = await fn();
    await redis.set(key, value, { ex: ttlSec });
    return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    const redis = getRedis();
    await redis.del(...keys);
}
