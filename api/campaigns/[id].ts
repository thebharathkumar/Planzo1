import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getRedis } from "../_lib/redis";
import { handle, bad } from "../_lib/respond";
import { requireUser } from "../_lib/auth";
import { ensureSeed } from "../_lib/seed";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const id = (req.query.id as string) || "";
    if (!id) return bad(res, 400, "INVALID_ID", "id is required");

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
