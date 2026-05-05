import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis.js";
import { handle, bad } from "../_lib/respond.js";
import { requireUser } from "../_lib/auth.js";
import { ensureSeed } from "../_lib/seed.js";
import { cached } from "../_lib/cache.js";

interface StoredCampaign {
    id: string;
    name: string;
    eventId: string;
    eventTitle: string;
    startDate: string;
    endDate: string;
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
    createdBy: string;
}

interface PerfRow {
    campaignId: string;
    name: string;
    eventId: string;
    eventTitle: string;
    impressions: number;
    opens: number;
    clicks: number;
    bookings: number;
    revenue: number;
    salesLift: number;
    ctr: number;
    conversionRate: number;
    openRate: number;
    adMediaStale: boolean;
}

const PLATFORM_ROLES = new Set(["admin", "marketing", "finance", "sales"]);

async function fetchAdMediaMetrics(): Promise<{ ok: boolean }> {
    const url = process.env.AD_MEDIA_API_URL;
    if (!url) return { ok: false };
    try {
        const res = await fetch(url, { method: "GET" });
        return { ok: res.ok };
    } catch {
        return { ok: false };
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const user = requireUser(req);
        const isWide = PLATFORM_ROLES.has(user.role);
        const cacheKey = `cache:campaign-performance:${isWide ? "all" : user.id}`;
        return cached(cacheKey, 60, async () => {
            const redis = getRedis();
            const adMedia = await fetchAdMediaMetrics();

            const ids = (await redis.smembers("campaigns:all")) ?? [];
            const rows: PerfRow[] = [];
            for (const id of ids) {
                const campaign = await redis.get<StoredCampaign>(`campaign:${id}`);
                if (!campaign) continue;
                if (!isWide && campaign.createdBy !== user.id) continue;
                const impressions = Number((await redis.get(`campaign:${id}:impressions`)) ?? campaign.sent ?? 0);
                const opens = Number((await redis.get(`campaign:${id}:opens`)) ?? campaign.opened ?? 0);
                const clicks = Number((await redis.get(`campaign:${id}:clicks`)) ?? campaign.clicked ?? 0);
                const bookings = Number((await redis.get(`campaign:${id}:bookings`)) ?? 0);
                const revenue = Number((await redis.get(`campaign:${id}:revenue`)) ?? campaign.revenue ?? 0);
                const ctr = impressions > 0 ? clicks / impressions : 0;
                const conversionRate = clicks > 0 ? bookings / clicks : 0;
                const openRate = impressions > 0 ? opens / impressions : 0;
                // Simple sales-lift baseline: revenue minus expected baseline (10% of impressions × $5 ARPU)
                const baseline = impressions * 0.5;
                const salesLift = revenue - baseline;
                rows.push({
                    campaignId: id,
                    name: campaign.name,
                    eventId: campaign.eventId,
                    eventTitle: campaign.eventTitle,
                    impressions,
                    opens,
                    clicks,
                    bookings,
                    revenue,
                    salesLift,
                    ctr,
                    conversionRate,
                    openRate,
                    adMediaStale: !adMedia.ok,
                });
            }
            rows.sort((a, b) => b.revenue - a.revenue);
            return { rows, meta: { adMediaStale: !adMedia.ok }, fetchedAt: new Date().toISOString() };
        });
    });
}
