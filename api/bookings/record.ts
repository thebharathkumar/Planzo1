import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireUser } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";

interface BookingRecord {
    bookingId: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
    tierId: string;
    tierName: string;
    quantity: number;
    total: number;
    stripeSessionId?: string;
    campaignId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const user = requireUser(req);
        const body = req.body as BookingRecord;
        if (!body?.bookingId || !body?.eventId) {
            const err = new Error("bookingId and eventId are required") as Error & { status: number; code: string };
            err.status = 400;
            err.code = "INVALID_BODY";
            throw err;
        }

        const redis = getRedis();
        const record = {
            id: body.bookingId,
            eventId: body.eventId,
            eventTitle: body.eventTitle,
            eventDate: body.eventDate,
            eventVenue: body.eventVenue,
            userId: user.id,
            tierName: body.tierName,
            quantity: body.quantity,
            total: body.total,
            status: "confirmed" as const,
            bookedAt: new Date().toISOString().slice(0, 10),
            qrCode: body.bookingId,
            stripeSessionId: body.stripeSessionId,
            campaignId: body.campaignId,
        };

        const pipe = redis.pipeline();
        pipe.set(`booking:${body.bookingId}`, record);
        pipe.sadd(`bookings:byUser:${user.id}`, body.bookingId);
        pipe.sadd(`bookings:byEvent:${body.eventId}`, body.bookingId);
        pipe.incrby(`event:${body.eventId}:ticketsSold`, body.quantity);
        pipe.incrbyfloat(`event:${body.eventId}:revenue`, body.total);
        if (body.campaignId) {
            pipe.incrby(`campaign:${body.campaignId}:bookings`, 1);
            pipe.incrbyfloat(`campaign:${body.campaignId}:revenue`, body.total);
        }
        // Invalidate analytics caches
        pipe.del(`cache:event-metrics:${body.eventId}`);
        pipe.del(`cache:dashboard:organizer:all`);
        pipe.del(`cache:event-performance:all`);
        await pipe.exec();
        return { ok: true };
    });
}
