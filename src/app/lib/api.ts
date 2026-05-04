import type { User } from "../mock-data";

export interface ApiResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    error: string | null;
    code: string | null;
}

function encodeUserHeader(user: User | null): string | undefined {
    if (!user) return undefined;
    const payload = JSON.stringify({ id: user.id, name: user.name, role: user.role });
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
        return window.btoa(unescape(encodeURIComponent(payload)));
    }
    return Buffer.from(payload, "utf-8").toString("base64");
}

export async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit & { user?: User | null } = {}
): Promise<ApiResult<T>> {
    const { user, headers, body, ...rest } = init;
    const finalHeaders = new Headers(headers);
    if (body !== undefined && !finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json");
    }
    const userHeader = encodeUserHeader(user ?? null);
    if (userHeader) finalHeaders.set("x-planzo-user", userHeader);

    let res: Response;
    try {
        res = await fetch(path, { ...rest, headers: finalHeaders, body });
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : "Network error",
            code: "NETWORK_ERROR",
        };
    }

    const text = await res.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        return {
            ok: false,
            status: res.status,
            data: null,
            error: `Server returned non-JSON response (${res.status})`,
            code: "BAD_RESPONSE",
        };
    }

    if (!res.ok) {
        return {
            ok: false,
            status: res.status,
            data: null,
            error: data?.error || `Request failed (${res.status})`,
            code: data?.code || "REQUEST_FAILED",
        };
    }

    return { ok: true, status: res.status, data: data as T, error: null, code: null };
}
