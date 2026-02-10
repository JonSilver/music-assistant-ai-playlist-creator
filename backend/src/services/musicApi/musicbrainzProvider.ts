/**
 * MusicBrainz music API provider implementation
 * Primary role: metadata enrichment (filling in album names for Last.fm results)
 */

import { attemptPromise } from "@jfdi/attempt";
import type { ExternalTrack } from "../../../../shared/types.js";
import type { ICacheEntry, IMusicApiProvider } from "./types.js";

const MUSICBRAINZ_API_URL = "https://musicbrainz.org/ws/2/recording";
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 5000;
const USER_AGENT = "MusicAssistantPlaylistCreator/0.8.1 ( https://github.com/JonSilver/music-assistant-ai-playlist-creator )";
const DEFAULT_LIMIT = 20;

interface IMusicBrainzArtistCredit {
    artist: { name: string };
}

interface IMusicBrainzRelease {
    title: string;
}

interface IMusicBrainzRecording {
    id: string;
    title: string;
    "artist-credit"?: IMusicBrainzArtistCredit[];
    releases?: IMusicBrainzRelease[];
    score?: number;
}

interface IMusicBrainzSearchResponse {
    recordings?: IMusicBrainzRecording[];
    count?: number;
}

export class MusicbrainzProvider implements IMusicApiProvider {
    readonly type = "musicbrainz" as const;
    private readonly cache = new Map<string, ICacheEntry<ExternalTrack[]>>();
    private lastRequestTime = 0;

    isAvailable(): boolean {
        return true;
    }

    async getSimilarTracks(_artist: string, _title: string): Promise<ExternalTrack[]> {
        // MusicBrainz has no similarity/recommendation engine.
        // Searching by title+artist just returns the same track in different releases.
        return [];
    }

    async getTopTracks(_artist: string): Promise<ExternalTrack[]> {
        // MusicBrainz has no popularity/chart data.
        return [];
    }

    async searchTracks(query: string): Promise<ExternalTrack[]> {
        const cacheKey = `search:${query}`;
        const cached = this.getFromCache(cacheKey);
        if (cached !== undefined) return cached;

        const tracks = await this.searchRecordings(query);
        this.setCache(cacheKey, tracks);
        return tracks;
    }

    private async searchRecordings(query: string): Promise<ExternalTrack[]> {
        await this.rateLimit();

        const url = `${MUSICBRAINZ_API_URL}?query=${encodeURIComponent(query)}&fmt=json&limit=${DEFAULT_LIMIT}`;

        const [err, result] = await attemptPromise(async () => {
            const response = await fetch(url, {
                headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
            });
            if (!response.ok) {
                console.error(`[MAPI] HTTP ${response.status} for query: ${query}`);
                return undefined;
            }
            return response.json() as Promise<IMusicBrainzSearchResponse>;
        });

        if (err !== undefined) {
            console.error(`[MAPI] Fetch error: ${err.message}`);
            return [];
        }
        if (result === undefined) return [];
        console.log(`[MAPI] Query returned ${result.recordings?.length ?? 0} recordings`);
        return this.mapRecordings(result.recordings);
    }

    private mapRecordings(recordings: IMusicBrainzRecording[] | undefined): ExternalTrack[] {
        if (recordings === undefined || !Array.isArray(recordings)) return [];
        return recordings
            .filter(r => r.title !== undefined && r["artist-credit"]?.length)
            .map((r): ExternalTrack => ({
                title: r.title,
                artist: r["artist-credit"]?.[0]?.artist.name ?? "Unknown",
                album: r.releases?.[0]?.title,
                source: "musicbrainz",
                confidence: r.score !== undefined ? r.score / 100 : undefined
            }));
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
