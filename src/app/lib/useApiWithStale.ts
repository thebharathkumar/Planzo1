import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiResult } from "./api";
import { useAuth } from "../store";

export interface UseApiWithStaleResult<T> {
    data: T | null;
    isLoading: boolean;
    isStale: boolean;
    lastLoadedAt: string | null;
    error: string | null;
    refetch: () => Promise<void>;
}

interface CacheEnvelope<T> {
    data: T;
    at: string;
}

function storageKey(key: string): string {
    return `planzo:apiCache:${key}`;
}

function readCache<T>(key: string): CacheEnvelope<T> | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(storageKey(key));
        if (!raw) return null;
        return JSON.parse(raw) as CacheEnvelope<T>;
    } catch {
        return null;
    }
}

function writeCache<T>(key: string, data: T): string {
    const at = new Date().toISOString();
    try {
        window.localStorage.setItem(storageKey(key), JSON.stringify({ data, at }));
    } catch {
        // ignore quota errors
    }
    return at;
}

export function useApiWithStale<T>(
    key: string,
    path: string | null,
    init?: RequestInit
): UseApiWithStaleResult<T> {
    const { currentUser } = useAuth();
    const [data, setData] = useState<T | null>(() => readCache<T>(key)?.data ?? null);
    const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(() => readCache<T>(key)?.at ?? null);
    const [isLoading, setIsLoading] = useState(false);
    const [isStale, setIsStale] = useState<boolean>(() => !!readCache<T>(key));
    const [error, setError] = useState<string | null>(null);
    const initRef = useRef(init);
    initRef.current = init;

    const refetch = useCallback(async () => {
        if (!path) return;
        setIsLoading(true);
        setError(null);
        const result: ApiResult<T> = await apiFetch<T>(path, { ...initRef.current, user: currentUser });
        if (result.ok && result.data !== null) {
            setData(result.data);
            setIsStale(false);
            setError(null);
            setLastLoadedAt(writeCache(key, result.data));
        } else {
            setError(result.error);
            const cached = readCache<T>(key);
            if (cached) {
                setData(cached.data);
                setLastLoadedAt(cached.at);
                setIsStale(true);
            }
        }
        setIsLoading(false);
    }, [path, key, currentUser]);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, isStale, lastLoadedAt, error, refetch };
}
