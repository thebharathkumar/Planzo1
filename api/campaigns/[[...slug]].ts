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

interface UpdateBody {
    name?: string;
    type?: "email" | "featured" | "push";
    audience?: string;
    content?: string;
    startDate?: string;
    endDate?: string;
    status?: "draft" | "active" | "completed";
}

function err(status: number, code: string, message: string): never {
    const e = new Error(message) as Error & { status: number; code: string };
    e.status = status;
    e.code = code;
    throw e;
}

function todayDateString(): string {
    return new Date().toISOString().slice(0, 10);
}

function getId(req: VercelRequest): string | null {
    const slug = req.query.slug;
    if (!slug) return null;
    if (Array.isArray(slug)) return slug[0] ?? null;
    return slug;
}

async function listCampaigns(redis: ReturnType<typeof getRedis>): Promise<StoredCampaign[]> {
    const ids = (await redis.smembers("campaigns:all")) ?? [];
    if (ids.length === 0) return [];
    const fetched = await Promise.all(ids.map((id) => redis.get<StoredCampaign>(`campaign:${id}`)));
    return fetched.filter((c): c is StoredCampaign => c !== null);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const id = getId(req);

    // List + create on /api/campaigns
    if (id === null) {
        if (req.method === "GET") {
            return handle(res, async () => {
                await ensureSeed();
                requireUser(req);
                const redis = getRedis();
                return { campaigns: await listCampaigns(redis) };
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

                const newId = `camp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                const now = new Date().toISOString();
                const campaign: StoredCampaign = {
                    id: newId,
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
                pipe.set(`campaign:${newId}`, campaign);
                pipe.sadd("campaigns:all", newId);
                pipe.sadd(`campaigns:byUser:${user.id}`, newId);
                pipe.lpush("notifications:queue", { kind: "campaign.created", campaignId: newId, at: now });
                pipe.lpush("analytics:campaigns:queue", { kind: "campaign.created", campaignId: newId, at: now });
                await pipe.exec();
                return { campaign };
            });
        }
        res.setHeader("Allow", "GET, POST");
        return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
    }

    // Detail + update on /api/campaigns/:id
    if (req.method === "GET") {
        return handle(res, async () => {
            await ensureSeed();
            requireUser(req);
            const redis = getRedis();
            const campaign = await redis.get<StoredCampaign>(`campaign:${id}`);
            if (!campaign) err(404, "NOT_FOUND", "Campaign not found");
            return { campaign };
        });
    }
    if (req.method === "PUT") {
        return handle(res, async () => {
            await ensureSeed();
            requireUser(req);
            const redis = getRedis();
            const existing = await redis.get<StoredCampaign>(`campaign:${id}`);
            if (!existing) err(404, "NOT_FOUND", "Campaign not found");
            if (existing!.status === "closed" || existing!.status === "expired") {
                err(409, "CAMPAIGN_NOT_EDITABLE", `Campaign with status '${existing!.status}' cannot be edited`);
            }

            const body = req.body as UpdateBody;
            const next: StoredCampaign = { ...existing! };

            if (body.name !== undefined) {
                const trimmed = body.name.trim();
                if (!trimmed) err(400, "INVALID_NAME", "Campaign name must not be blank");
                next.name = trimmed;
            }
            if (body.type !== undefined) next.type = body.type;
            if (body.audience !== undefined) next.audience = body.audience;
            if (body.content !== undefined) next.content = body.content;
            if (body.startDate !== undefined) next.startDate = body.startDate;
            if (body.endDate !== undefined) next.endDate = body.endDate;
            if (body.status !== undefined) next.status = body.status;

            if (next.endDate <= next.startDate) err(400, "INVALID_DATE_RANGE", "End date must be after start date");
            if (next.status === "active" && next.startDate < todayDateString()) {
                err(400, "PAST_START_DATE", "Active campaigns cannot have a start date before today");
            }

            next.updatedAt = new Date().toISOString();

            const pipe = redis.pipeline();
            pipe.set(`campaign:${id}`, next);
            pipe.lpush("notifications:queue", { kind: "campaign.updated", campaignId: id, at: next.updatedAt });
            pipe.lpush("analytics:campaigns:queue", { kind: "campaign.updated", campaignId: id, at: next.updatedAt });
            await pipe.exec();

            return { campaign: next };
        });
    }
    res.setHeader("Allow", "GET, PUT");
    return bad(res, 405, "METHOD_NOT_ALLOWED", "Method not allowed");
}
