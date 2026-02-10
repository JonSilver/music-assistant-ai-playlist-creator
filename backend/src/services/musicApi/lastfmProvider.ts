/**
 * Last.fm music API provider implementation
 */

import { attemptPromise } from "@jfdi/attempt";
import type { ExternalTrack } from "../../../../shared/types.js";
import type { ICacheEntry, IMusicApiProvider } from "./types.js";

const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/";
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT = "MusicAssistantPlaylistCreator/1.0";

interface ILastfmTrack {
    name: string;
    artist: { name: string } | string;
    match?: number;
    url?: string;
}

interface ILastfmResponse {
    similartracks?: { track: ILastfmTrack[] };
    toptracks?: { track: ILastfmTrack[] };
    results?: { trackmatches?: { track: ILastfmTrack[] } };
}

export class LastfmProvider implements IMusicApiProvider {
    readonly type = "lastfm" as const;
    private readonly apiKey: string;
    private readonly cache = new Map<string, ICacheEntry<ExternalTrack[]>>();
    private lastRequestTime = 0;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    isAvailable(): boolean {
        return this.apiKey.trim().length > 0;
    }

    async getSimilarTracks(artist: string, title: string): Promise<ExternalTrack[]> {
        const cacheKey = `similar:${artist}:${title}`;
        const cached = this.getFromCache(cacheKey);
        if (cached !== undefined) return cached;

        const params = { method: "track.getSimilar", artist, track: title, limit: "20" };
        const data = await this.fetchApi(params);
        const tracks = this.mapTracks(data?.similartracks?.track);
        this.setCache(cacheKey, tracks);
        return tracks;
    }

    async getTopTracks(artist: string): Promise<ExternalTrack[]> {
        const cacheKey = `top:${artist}`;
        const cached = this.getFromCache(cacheKey);
        if (cached !== undefined) return cached;

        const params = { method: "artist.getTopTracks", artist, limit: "20" };
        const data = await this.fetchApi(params);
        const tracks = this.mapTracks(data?.toptracks?.track);
        this.setCache(cacheKey, tracks);
        return tracks;
    }

    async searchTracks(query: string): Promise<ExternalTrack[]> {
        const cacheKey = `search:${query}`;
        const cached = this.getFromCache(cacheKey);
        if (cached !== undefined) return cached;

        const params = { method: "track.search", track: query, limit: "20" };
        const data = await this.fetchApi(params);
        const tracks = this.mapTracks(data?.results?.trackmatches?.track);
        this.setCache(cacheKey, tracks);
        return tracks;
    }

    private mapTracks(tracks: ILastfmTrack[] | undefined): ExternalTrack[] {
        if (tracks === undefined || !Array.isArray(tracks)) return [];
        return tracks.map((t): ExternalTrack => ({
            title: t.name,
            artist: typeof t.artist === "string" ? t.artist : t.artist.name,
            source: "lastfm",
            confidence: t.match !== undefined ? Number(t.match) : undefined,
            externalUrl: t.url
        }));
    }

    private async fetchApi(
        params: Record<string, string>
    ): Promise<ILastfmResponse | undefined> {
        await this.rateLimit();

        const url = new URL(LASTFM_API_URL);
        url.searchParams.set("api_key", this.apiKey);
        url.searchParams.set("format", "json");
        for (const [key, value] of Object.entries(params))
            url.searchParams.set(key, value);


        const [err, result] = await attemptPromise(async () => {
            const response = await fetch(url.toString(), {
                headers: { "User-Agent": USER_AGENT },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
            });
            if (!response.ok) {
                console.error(`[MAPI] HTTP ${response.status} for ${params.method}`);
                return undefined;
            }
            return response.json() as Promise<ILastfmResponse>;
        });

        if (err !== undefined) {
            console.error(`[MAPI] Fetch error for ${params.method}: ${err.message}`);
        }
        return err !== undefined ? undefined : result;
    }

    private async rateLimit(): Promise<void> {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < REQUEST_DELAY_MS)
            await new Promise(resolve =>
                setTimeout(resolve, REQUEST_DELAY_MS - elapsed)
            );

        this.lastRequestTime = Date.now();
    }

    private getFromCache(key: string): ExternalTrack[] | undefined {
        const entry = this.cache.get(key);
        if (entry === undefined) return undefined;
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.data;
    }

    private setCache(key: string, data: ExternalTrack[]): void {
        this.cache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS });
    }
}
