import type { VercelRequest } from "@vercel/node";

export type Role =
    | "attendee"
    | "organizer"
    | "admin"
    | "finance"
    | "sales"
    | "accountant"
    | "marketing";

export interface RequestUser {
    id: string;
    name: string;
    role: Role;
}

const HEADER = "x-planzo-user";

export function getUser(req: VercelRequest): RequestUser | null {
    const raw = req.headers[HEADER];
    if (!raw || typeof raw !== "string") return null;
    try {
        const json = Buffer.from(raw, "base64").toString("utf-8");
        const parsed = JSON.parse(json) as RequestUser;
        if (!parsed?.id || !parsed?.role) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function requireUser(req: VercelRequest): RequestUser {
    const user = getUser(req);
    if (!user) {
        const err = new Error("Authentication required") as Error & { status?: number; code?: string };
        err.status = 401;
        err.code = "UNAUTHENTICATED";
        throw err;
    }
    return user;
}

export function requireRole(req: VercelRequest, allowed: Role[]): RequestUser {
    const user = requireUser(req);
    if (!allowed.includes(user.role)) {
        const err = new Error(`Role ${user.role} not permitted`) as Error & { status?: number; code?: string };
        err.status = 403;
        err.code = "FORBIDDEN";
        throw err;
    }
    return user;
}
