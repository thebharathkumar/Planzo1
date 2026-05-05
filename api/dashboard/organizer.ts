import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis.js";
import { handle, bad } from "../_lib/respond.js";
import { requireUser, RequestUser } from "../_lib/auth.js";
import { ensureSeed } from "../_lib/seed.js";
import { cached } from "../_lib/cache.js";

interface StoredEvent {
    id: string;
    title: string;
    organizerId: string;
    tiers: Array<{ price: number; total: number; remaining: number }>;
    status: string;
}

interface StoredBooking {
    id: string;
    eventId: string;
    quantity: number;
    total: number;
    status: "confirmed" | "cancelled" | "pending";
}

interface AggregateRating {
    avg: number;
    count: number;
}

interface DashboardResponse {
    scope: "organizer" | "platform";
    organizerId?: string;
    kpis: {
        sales: number;
        revenue: number;
        cancellations: number;
        engagement: number;
        commission: number;
        netPayout: number;
        avgRating: number;
        ratingCount: number;
    };
    activeEvents: number;
    fetchedAt: string;
}

const PLATFORM_ROLES = new Set(["finance", "sales", "admin", "accountant"]);

async function buildDashboard(user: RequestUser): Promise<DashboardResponse> {
    const redis = getRedis();
    const seePlatform = PLATFORM_ROLES.has(user.role);
    const scope: "organizer" | "platform" = seePlatform ? "platform" : "organizer";

    const eventIds = seePlatform
        ? ((await redis.smembers("events:all")) ?? [])
        : ((await redis.smembers(`events:byOrganizer:${user.id}`)) ?? []);

    let revenue = 0;
    let sales = 0;
    let cancellations = 0;
    let engagement = 0;
    let activeEvents = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    for (const eventId of eventIds) {
        const event = await redis.get<StoredEvent>(`event:${eventId}`);
        if (!event) continue;
        if (event.status !== "draft") activeEvents += 1;

        const ticketsSold = Number((await redis.get(`event:${eventId}:ticketsSold`)) ?? 0);
        const eventRevenue = Number((await redis.get(`event:${eventId}:revenue`)) ?? 0);
        const views = Number((await redis.get(`event:${eventId}:views`)) ?? 0);
        const clicks = Number((await redis.get(`event:${eventId}:clicks`)) ?? 0);
        sales += ticketsSold;
        revenue += eventRevenue;
        engagement += views + clicks;

        const bookingIds = (await redis.smembers(`bookings:byEvent:${eventId}`)) ?? [];
        for (const bid of bookingIds) {
            const b = await redis.get<StoredBooking>(`booking:${bid}`);
            if (b?.status === "cancelled") cancellations += 1;
        }

        const agg = await redis.get<AggregateRating>(`event:${eventId}:aggregateRating`);
        if (agg && agg.count > 0) {
            ratingSum += agg.avg * agg.count;
            ratingCount += agg.count;
        }
    }

    const commission = Math.round(revenue * 0.10 * 100) / 100;
    const netPayout = Math.round((revenue - commission) * 100) / 100;
    const avgRating = ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

    return {
        scope,
        organizerId: seePlatform ? undefined : user.id,
        kpis: {
            sales,
            revenue: Math.round(revenue * 100) / 100,
            cancellations,
            engagement,
            commission,
            netPayout,
            avgRating,
            ratingCount,
        },
        activeEvents,
        fetchedAt: new Date().toISOString(),
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const user = requireUser(req);
        const cacheKey = `cache:dashboard:organizer:${PLATFORM_ROLES.has(user.role) ? "all" : user.id}`;
        return cached(cacheKey, 60, () => buildDashboard(user));
    });
}
