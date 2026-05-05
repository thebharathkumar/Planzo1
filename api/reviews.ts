import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "./_lib/redis.js";
import { handle, bad } from "./_lib/respond.js";
import { requireUser } from "./_lib/auth.js";
import { ensureSeed } from "./_lib/seed.js";

interface ReviewBody {
    bookingId: string;
    rating: number;
    text: string;
}

interface StoredBooking {
    id: string;
    eventId: string;
    userId: string;
    status: "confirmed" | "cancelled" | "pending";
}

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

function err(status: number, code: string, message: string): never {
    const e = new Error(message) as Error & { status: number; code: string };
    e.status = status;
    e.code = code;
    throw e;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // GET /api/reviews?eventId=... → list reviews + aggregate
    if (req.method === "GET") {
        return handle(res, async () => {
            await ensureSeed();
            const eventId = (req.query.eventId as string) || "";
            if (!eventId) err(400, "INVALID_QUERY", "eventId is required");

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

    // POST /api/reviews → submit
    if (req.method === "POST") {
        return handle(res, async () => {
            await ensureSeed();
            const user = requireUser(req);
            const body = req.body as ReviewBody;

            const rating = Number(body?.rating);
            const text = typeof body?.text === "string" ? body.text : "";
            const bookingId = body?.bookingId;

            if (!bookingId) err(400, "INVALID_BODY", "bookingId is required");
            if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
                err(400, "INVALID_RATING", "Rating must be an integer between 1 and 5");
            }
            if (!text.trim()) err(400, "INVALID_TEXT", "Review text must not be blank");
            if (text.length > 1000) err(400, "INVALID_TEXT", "Review text must not exceed 1000 characters");

            const redis = getRedis();
            const booking = await redis.get<StoredBooking>(`booking:${bookingId}`);
            if (!booking) err(404, "BOOKING_NOT_FOUND", "Booking not found");
            if (booking!.userId !== user.id) err(403, "NOT_OWNER", "You can only review your own bookings");
            if (booking!.status !== "confirmed") err(403, "NOT_CONFIRMED", "Reviews can only be submitted for confirmed bookings");

            const reviewId = `rev-${bookingId}`;
            const exists = await redis.get(`review:${reviewId}`);
            if (exists) err(409, "DUPLICATE_REVIEW", "A review for this booking already exists");

            const review: StoredReview = {
                id: reviewId,
                bookingId,
                eventId: booking!.eventId,
                userId: user.id,
                userName: user.name,
                rating,
                text: text.trim(),
                createdAt: new Date().toISOString(),
            };

            const aggKey = `event:${booking!.eventId}:aggregateRating`;
            const current = (await redis.get<AggregateRating>(aggKey)) ?? { avg: 0, count: 0, sum: 0, updatedAt: new Date().toISOString() };
            const sum = current.sum + rating;
            const count = current.count + 1;
            const next: AggregateRating = { sum, count, avg: sum / count, updatedAt: new Date().toISOString() };

            const pipe = redis.pipeline();
            pipe.set(`review:${reviewId}`, review);
            pipe.sadd(`event:${booking!.eventId}:reviews`, reviewId);
            pipe.set(aggKey, next);
            await pipe.exec();

            return { review, aggregate: next };
        });
    }

    res.setHeader("Allow", "GET, POST");
    return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
}
