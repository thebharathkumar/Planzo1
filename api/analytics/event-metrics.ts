import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis.js";
import { handle, bad } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { ensureSeed } from "../_lib/seed.js";
import { cached } from "../_lib/cache.js";

interface StoredEvent {
    id: string;
    title: string;
    organizerId: string;
}

const PLATFORM_ROLES = new Set(["admin", "marketing", "finance", "sales"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const user = requireUser(req);
        if (!PLATFORM_ROLES.has(user.role) && user.role !== "organizer") {
            const e = new Error("Insufficient permissions") as Error & { status: number; code: string };
            e.status = 403;
            e.code = "FORBIDDEN";
            throw e;
        }
        const eventId = (req.query.eventId as string) || "";
        if (!eventId) {
            const e = new Error("eventId is required") as Error & { status: number; code: string };
            e.status = 400;
            e.code = "INVALID_QUERY";
            throw e;
        }

        return cached(`cache:event-metrics:${eventId}`, 60, async () => {
            const redis = getRedis();
            const event = await redis.get<StoredEvent>(`event:${eventId}`);
            if (!event) {
                const e = new Error("Event not found") as Error & { status: number; code: string };
                e.status = 404;
                e.code = "NOT_FOUND";
                throw e;
            }
            if (user.role === "organizer" && event.organizerId !== user.id) {
                const e = new Error("Not your event") as Error & { status: number; code: string };
                e.status = 403;
                e.code = "FORBIDDEN";
                throw e;
            }
            const views = Number((await redis.get(`event:${eventId}:views`)) ?? 0);
            const clicks = Number((await redis.get(`event:${eventId}:clicks`)) ?? 0);
            const ticketsSold = Number((await redis.get(`event:${eventId}:ticketsSold`)) ?? 0);
            const revenue = Number((await redis.get(`event:${eventId}:revenue`)) ?? 0);
            const conversionRate = views > 0 ? ticketsSold / views : 0;
            const revenuePerView = views > 0 ? revenue / views : 0;
            // Synthesize a 7-bucket time series from the totals (real implementation
            // would consume the platform's analytics pipeline).
            const buckets = Array.from({ length: 7 }, (_, i) => {
                const factor = 0.7 + (i / 7) * 0.6;
                return {
                    label: `T-${6 - i}d`,
                    views: Math.round((views / 7) * factor),
                    clicks: Math.round((clicks / 7) * factor),
                    ticketsSold: Math.round((ticketsSold / 7) * factor),
                    revenue: Math.round((revenue / 7) * factor),
                };
            });
            return {
                eventId,
                title: event.title,
                totals: { views, clicks, ticketsSold, revenue, conversionRate, revenuePerView },
                series: buckets,
                fetchedAt: new Date().toISOString(),
            };
        });
    });
}
