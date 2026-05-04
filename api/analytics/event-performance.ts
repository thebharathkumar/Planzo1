import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireRole } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";
import { cached } from "../_lib/cache";

interface StoredEvent {
    id: string;
    title: string;
    organizerId: string;
    status: string;
}

interface PerformanceRow {
    eventId: string;
    title: string;
    status: string;
    views: number;
    clicks: number;
    ticketsSold: number;
    revenue: number;
    refunds: number;
    conversionRate: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const user = requireRole(req, ["organizer", "admin", "sales"]);
        const isWide = user.role === "admin" || user.role === "sales";

        const cacheKey = `cache:event-performance:${isWide ? "all" : user.id}`;
        return cached(cacheKey, 60, async () => {
            const redis = getRedis();
            const eventIds = isWide
                ? ((await redis.smembers("events:all")) ?? [])
                : ((await redis.smembers(`events:byOrganizer:${user.id}`)) ?? []);

            const rows: PerformanceRow[] = [];
            for (const eventId of eventIds) {
                const event = await redis.get<StoredEvent>(`event:${eventId}`);
                if (!event) continue;
                const views = Number((await redis.get(`event:${eventId}:views`)) ?? 0);
                const clicks = Number((await redis.get(`event:${eventId}:clicks`)) ?? 0);
                const ticketsSold = Number((await redis.get(`event:${eventId}:ticketsSold`)) ?? 0);
                const revenue = Number((await redis.get(`event:${eventId}:revenue`)) ?? 0);
                const refunds = Number((await redis.get(`event:${eventId}:refunds`)) ?? 0);
                const conversionRate = views > 0 ? ticketsSold / views : 0;
                rows.push({ eventId, title: event.title, status: event.status, views, clicks, ticketsSold, revenue, refunds, conversionRate });
            }
            rows.sort((a, b) => b.revenue - a.revenue);
            return { rows, fetchedAt: new Date().toISOString() };
        });
    });
}
