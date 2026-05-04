import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireUser } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";
import { cached } from "../_lib/cache";

interface StoredEvent {
    id: string;
    title: string;
    category: string;
}

interface AnalyticsMetric {
    month: string;
    revenue: number;
    ticketsSold: number;
    attendees: number;
    newUsers: number;
}

interface TrendBucket {
    label: string;
    revenue: number;
    ticketsSold: number;
    bookings: number;
    growthRate: number;
    isPeak: boolean;
}

const PLATFORM_ROLES = new Set(["admin", "marketing", "finance", "sales"]);

function expandSeries(monthly: AnalyticsMetric[], period: "daily" | "weekly" | "monthly"): TrendBucket[] {
    if (period === "monthly") {
        return monthly.map((m) => ({
            label: m.month,
            revenue: m.revenue,
            ticketsSold: m.ticketsSold,
            bookings: Math.round(m.ticketsSold * 0.85),
            growthRate: 0,
            isPeak: false,
        }));
    }
    const factor = period === "daily" ? 30 : 4;
    const out: TrendBucket[] = [];
    monthly.forEach((m, mi) => {
        for (let i = 0; i < factor; i++) {
            const slice = (Math.sin((mi * factor + i) / 3) + 1.2) / 2.4;
            const revenue = Math.round((m.revenue / factor) * slice);
            const tickets = Math.round((m.ticketsSold / factor) * slice);
            out.push({
                label: `${m.month}-${period === "daily" ? `D${i + 1}` : `W${i + 1}`}`,
                revenue,
                ticketsSold: tickets,
                bookings: Math.round(tickets * 0.85),
                growthRate: 0,
                isPeak: false,
            });
        }
    });
    return out;
}

function annotate(series: TrendBucket[]): TrendBucket[] {
    if (series.length === 0) return series;
    // Period-over-period growth
    for (let i = 1; i < series.length; i++) {
        const prev = series[i - 1].revenue;
        series[i].growthRate = prev > 0 ? (series[i].revenue - prev) / prev : 0;
    }
    // Seasonal peaks: top buckets above mean + std-dev
    const revenues = series.map((b) => b.revenue);
    const mean = revenues.reduce((s, v) => s + v, 0) / revenues.length;
    const variance = revenues.reduce((s, v) => s + (v - mean) ** 2, 0) / revenues.length;
    const stdDev = Math.sqrt(variance);
    const threshold = mean + stdDev;
    const candidates = series
        .map((b, i) => ({ i, value: b.revenue }))
        .filter((b) => b.value >= threshold)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    for (const c of candidates) series[c.i].isPeak = true;
    return series;
}

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
        const period = ((req.query.period as string) || "monthly") as "daily" | "weekly" | "monthly";
        if (!["daily", "weekly", "monthly"].includes(period)) {
            const e = new Error("Invalid period") as Error & { status: number; code: string };
            e.status = 400;
            e.code = "INVALID_PERIOD";
            throw e;
        }

        const cacheKey = `cache:rev-trends:${period}:${user.role}`;
        return cached(cacheKey, 120, async () => {
            const redis = getRedis();
            const monthly = (await redis.get<AnalyticsMetric[]>("analytics:platform")) ?? [];
            const eventIds = (await redis.smembers("events:all")) ?? [];

            // Group revenue by category
            const byCategory: Record<string, number> = {};
            for (const eid of eventIds) {
                const event = await redis.get<StoredEvent>(`event:${eid}`);
                if (!event) continue;
                const revenue = Number((await redis.get(`event:${eid}:revenue`)) ?? 0);
                byCategory[event.category] = (byCategory[event.category] ?? 0) + revenue;
            }

            const series = annotate(expandSeries(monthly, period));
            const totalRevenue = series.reduce((s, b) => s + b.revenue, 0);
            const overallGrowth = series.length > 1 ? series[series.length - 1].growthRate : 0;

            return {
                period,
                series,
                byCategory,
                totals: { revenue: totalRevenue, growthRate: overallGrowth },
                fetchedAt: new Date().toISOString(),
            };
        });
    });
}
