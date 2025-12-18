/**
 * Music Assistant client types - extracted to keep main file under 200 lines
 */

import type { MATrack } from "../../../shared/types.js";

export interface MAResponse {
    message_id?: string;
    result?: unknown;
    error?: {
        error_code: string;
        message: string;
    };
}

export interface MASearchResults {
    artists: unknown[];
    albums: unknown[];
    tracks: MATrack[];
    playlists: unknown[];
    radio: unknown[];
    podcasts?: unknown[];
    audiobooks?: unknown[];
}

export interface MAFavoritesResponse {
    count: number;
    total: number;
    items: { name: string }[];
}

export interface MAPlaylist {
    item_id: string;
    provider: string;
    name: string;
    uri: string;
}

export interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
}
