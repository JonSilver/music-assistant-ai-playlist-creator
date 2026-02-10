/**
 * Internal types for music API provider implementations
 */

import type { ExternalTrack, MusicApiProviderType } from "../../../../shared/types.js";

/** Provider interface - each external music API must implement this */
export interface IMusicApiProvider {
    readonly type: MusicApiProviderType;

    /** Get tracks similar to a given track */
    getSimilarTracks(artist: string, title: string): Promise<ExternalTrack[]>;

    /** Get top/popular tracks for an artist */
    getTopTracks(artist: string): Promise<ExternalTrack[]>;

    /** Search for tracks matching a free-text query */
    searchTracks(query: string): Promise<ExternalTrack[]>;

    /** Check if the provider is configured and available */
    isAvailable(): boolean;
}

/** Cached API response with TTL */
export interface ICacheEntry<T> {
    data: T;
    expiry: number;
}
