import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { ensureSeed } from "../_lib/seed";

interface StoredReview {
    id: string;
    bookingId: string;
    eventId: string;
    userId: string;
    userName: string;
    rating: number;
    text: string;
    createdAt: string;
}

interface AggregateRating {
    avg: number;
    count: number;
    sum: number;
    updatedAt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const eventId = (req.query.eventId as string) || "";
        if (!eventId) {
            const e = new Error("eventId is required") as Error & { status: number; code: string };
            e.status = 400;
            e.code = "INVALID_QUERY";
            throw e;
        }

        const redis = getRedis();
        const ids = (await redis.smembers(`event:${eventId}:reviews`)) ?? [];
        const reviews: StoredReview[] = [];
        if (ids.length > 0) {
            const fetched = await Promise.all(ids.map((id) => redis.get<StoredReview>(`review:${id}`)));
            for (const r of fetched) if (r) reviews.push(r);
            reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        const aggregate = (await redis.get<AggregateRating>(`event:${eventId}:aggregateRating`)) ?? { avg: 0, count: 0, sum: 0, updatedAt: new Date().toISOString() };

        return { reviews, aggregate };
    });
}
