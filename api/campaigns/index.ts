import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireUser } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";

interface StoredEvent {
    id: string;
    title: string;
    status: string;
}

interface StoredCampaign {
    id: string;
    name: string;
    type: "email" | "featured" | "push";
    eventId: string;
    eventTitle: string;
    audience: string;
    content: string;
    startDate: string;
    endDate: string;
    status: "draft" | "active" | "completed" | "expired" | "closed";
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface CreateBody {
    name: string;
    type?: "email" | "featured" | "push";
    eventId: string;
    audience?: string;
    content?: string;
    startDate: string;
    endDate: string;
    status?: "draft" | "active";
}

function err(status: number, code: string, message: string, extra?: Record<string, unknown>): never {
    const e = new Error(message) as Error & { status: number; code: string; extra?: Record<string, unknown> };
    e.status = status;
    e.code = code;
    if (extra) e.extra = extra;
    throw e;
}

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

async function listCampaigns(redis: ReturnType<typeof getRedis>): Promise<StoredCampaign[]> {
    const ids = (await redis.smembers("campaigns:all")) ?? [];
    if (ids.length === 0) return [];
    const fetched = await Promise.all(ids.map((id) => redis.get<StoredCampaign>(`campaign:${id}`)));
    return fetched.filter((c): c is StoredCampaign => c !== null);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "GET") {
        return handle(res, async () => {
            await ensureSeed();
            requireUser(req);
            const redis = getRedis();
            const all = await listCampaigns(redis);
            return { campaigns: all };
        });
    }
    if (req.method === "POST") {
        return handle(res, async () => {
            await ensureSeed();
            const user = requireUser(req);
            const body = req.body as CreateBody;

            const name = body?.name?.trim();
            const startDate = body?.startDate;
            const endDate = body?.endDate;
            const eventId = body?.eventId;

            if (!name) err(400, "INVALID_NAME", "Campaign name must not be blank");
            if (!startDate || !endDate) err(400, "INVALID_DATES", "Start and end dates are required");
            if (startDate < todayDateString()) err(400, "PAST_START_DATE", "Start date must not be in the past");
            if (endDate <= startDate) err(400, "INVALID_DATE_RANGE", "End date must be after start date");
            if (!eventId) err(400, "INVALID_EVENT", "Linked event is required");

            const redis = getRedis();
            const event = await redis.get<StoredEvent>(`event:${eventId}`);
            if (!event) err(400, "INVALID_EVENT", "Linked event not found");
            if (event!.status !== "upcoming") err(400, "EVENT_NOT_PUBLISHED", "Linked event must be Published (status=upcoming)");

            const id = `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
            const now = new Date().toISOString();
            const campaign: StoredCampaign = {
                id,
                name,
                type: body.type ?? "email",
                eventId,
                eventTitle: event!.title,
                audience: body.audience ?? "all-users",
                content: body.content ?? "",
                startDate,
                endDate,
                status: body.status ?? "draft",
                sent: 0,
                opened: 0,
                clicked: 0,
                revenue: 0,
                createdBy: user.id,
                createdAt: now,
                updatedAt: now,
            };

            const pipe = redis.pipeline();
            pipe.set(`campaign:${id}`, campaign);
            pipe.sadd("campaigns:all", id);
            pipe.sadd(`campaigns:byUser:${user.id}`, id);
            // DF-Out: notification + analytics queues
            pipe.lpush("notifications:queue", { kind: "campaign.created", campaignId: id, at: now });
            pipe.lpush("analytics:campaigns:queue", { kind: "campaign.created", campaignId: id, at: now });
            await pipe.exec();

            return { campaign };
        });
    }
    res.setHeader("Allow", "GET, POST");
    return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
}
