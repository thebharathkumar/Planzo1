import type { VercelResponse } from "@vercel/node";

export function ok<T>(res: VercelResponse, data: T, status = 200) {
    return res.status(status).json(data);
}

export function bad(res: VercelResponse, status: number, code: string, message: string, extra?: Record<string, unknown>) {
    return res.status(status).json({ error: message, code, ...extra });
}

export async function handle(
    res: VercelResponse,
    fn: () => Promise<unknown> | unknown
) {
    try {
        const result = await fn();
        if (result !== undefined && !res.headersSent) {
            return ok(res, result);
        }
    } catch (err) {
        const e = err as Error & { status?: number; code?: string };
        const status = e.status ?? 500;
        const code = e.code ?? "INTERNAL_ERROR";
        const message = e.message || "Unexpected server error";
        if (!res.headersSent) {
            return bad(res, status, code, message);
        }
    }
}
