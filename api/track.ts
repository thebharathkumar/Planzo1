import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "./_lib/redis.js";
import { handle, bad } from "./_lib/respond.js";
import { ensureSeed } from "./_lib/seed.js";

interface TrackBody {
    type: "view" | "click";
    eventId?: string;
    campaignId?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }
    return handle(res, async () => {
        await ensureSeed();
        const body = req.body as TrackBody;
        if (!body || (body.type !== "view" && body.type !== "click")) {
            const err = new Error("type must be 'view' or 'click'") as Error & { status: number; code: string };
            err.status = 400;
            err.code = "INVALID_TYPE";
            throw err;
        }
        const redis = getRedis();
        const pipe = redis.pipeline();
        const suffix = body.type === "view" ? "views" : "clicks";
        if (body.eventId) pipe.incr(`event:${body.eventId}:${suffix}`);
        if (body.campaignId) {
            const campaignSuffix = body.type === "view" ? "impressions" : "clicks";
            pipe.incr(`campaign:${body.campaignId}:${campaignSuffix}`);
        }
        if (body.eventId) pipe.del(`cache:event-metrics:${body.eventId}`);
        await pipe.exec();
        return { ok: true };
    });
}
