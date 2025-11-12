import WebSocket from "ws";
import { attempt, attemptPromise } from "@jfdi/attempt";
import type { MATrack } from "../../../shared/types.js";
import {
    MA_COMMANDS,
    MEDIA_TYPES,
    WS_MESSAGE_PREFIX,
    WS_PATH,
    TIMEOUTS,
    LIMITS,
    ERROR_MESSAGES
} from "../../../shared/constants/index.js";

interface MAResponse {
    message_id: string;
    result?: unknown;
    error?: {
        error_code: string;
        message: string;
    };
}

interface MASearchResults {
    artists: unknown[];
    albums: unknown[];
    tracks: MATrack[];
    playlists: unknown[];
    radio: unknown[];
    podcasts?: unknown[];
    audiobooks?: unknown[];
}

interface MAFavoritesResponse {
    count: number;
    total: number;
    items: { name: string }[];
}

interface MAPlaylist {
    item_id: string;
    provider: string;
    name: string;
    uri: string;
}

export class MusicAssistantClient {
    private ws: WebSocket | null = null;
    private messageId = 0;
    private pendingRequests = new Map<
        string,
        {
            resolve: (value: unknown) => void;
            reject: (error: Error) => void;
        }
    >();

    constructor(private url: string) {}

    async connect(): Promise<void> {
        const wsUrl = this.url.replace(/^http/, "ws") + WS_PATH;

        const [err] = await attemptPromise(async () => {
            this.ws = new WebSocket(wsUrl);

            return new Promise<void>((resolve, reject) => {
                if (this.ws === null) {
                    reject(new Error(ERROR_MESSAGES.WS_NOT_INITIALIZED));
                    return;
                }

                this.ws.on("open", () => {
                    resolve();
                });
                this.ws.on("error", err => {
                    reject(err);
                });
                this.ws.on("message", data => {
                    this.handleMessage(data.toString());
                });
            });
        });

        if (err !== undefined) {
            throw new Error(`${ERROR_MESSAGES.CONNECTION_FAILED}: ${err.message}`);
        }
    }

    private handleMessage(data: string): void {
        const [err, message] = attempt(() => JSON.parse(data) as MAResponse);

        if (err !== undefined) {
            console.error("Failed to parse MA message:", err);
            return;
        }

        // Log the raw message to see actual structure
        console.log("Raw MA message:", data.substring(0, 1000));

        const pending = this.pendingRequests.get(message.message_id);

        if (pending === undefined) return;

        if (message.error !== undefined && message.error !== null) {
            console.error("MA Error response:", message.error);
            pending.reject(new Error(message.error.message));
        } else {
            const resultStr =
                message.result !== undefined ? JSON.stringify(message.result) : "undefined";
            console.log("MA Response for", message.message_id, ":", resultStr.substring(0, 500));
            pending.resolve(message.result);
        }

        this.pendingRequests.delete(message.message_id);
    }

    private async sendCommand<T>(command: string, params?: Record<string, unknown>): Promise<T> {
        if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error(ERROR_MESSAGES.WS_NOT_CONNECTED);
        }

        const messageId = `${WS_MESSAGE_PREFIX}${this.messageId++}`;
        const message = {
            message_id: messageId,
            command,
            args: params ?? {}
        };

        console.log("MA Command:", command, "Full message:", JSON.stringify(message));

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(messageId, {
                resolve: resolve as (value: unknown) => void,
                reject
            });

            const [err] = attempt(() => {
                this.ws?.send(JSON.stringify(message));
            });

            if (err !== undefined) {
                this.pendingRequests.delete(messageId);
                reject(err);
            }

            // Timeout
            setTimeout(() => {
                if (this.pendingRequests.has(messageId)) {
                    this.pendingRequests.delete(messageId);
                    reject(new Error(ERROR_MESSAGES.REQUEST_TIMEOUT));
                }
            }, TIMEOUTS.AI_REQUEST);
        });
    }

    async searchTracks(query: string, limit = LIMITS.SEARCH_TRACKS): Promise<MATrack[]> {
        const result = await this.sendCommand<MASearchResults>(MA_COMMANDS.SEARCH, {
            search_query: query,
            media_types: [MEDIA_TYPES.TRACK],
            limit
        });

        if (result === undefined || result === null) {
            console.error("Search returned undefined/null result for query:", query);
            return [];
        }

        if (!result.tracks || !Array.isArray(result.tracks)) {
            console.error("Search result missing tracks array. Result:", JSON.stringify(result));
            return [];
        }

        return result.tracks;
    }

    async getFavoriteArtists(): Promise<string[]> {
        const [err, result] = await attemptPromise(async () => {
            const response = await this.sendCommand<MAFavoritesResponse>(MA_COMMANDS.FAVORITES, {
                media_type: MEDIA_TYPES.ARTIST
            });
            return response.items.map(item => item.name);
        });

        // If favorites endpoint doesn't exist or fails, return empty array
        return err !== undefined ? [] : result;
    }

    async getLibraryTracks(limit = LIMITS.LIBRARY_TRACKS): Promise<MATrack[]> {
        const result = await this.sendCommand<{ items: MATrack[] }>(MA_COMMANDS.LIBRARY_ITEMS, {
            media_type: MEDIA_TYPES.TRACK,
            limit
        });

        return result.items;
    }

    async createPlaylist(name: string, providerInstance?: string): Promise<string> {
        const result = await this.sendCommand<MAPlaylist>(MA_COMMANDS.CREATE_PLAYLIST, {
            name,
            provider_instance: providerInstance
        });

        // The response is a full Playlist object with item_id, uri, etc.
        return result.item_id;
    }

    async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
        await this.sendCommand(MA_COMMANDS.ADD_PLAYLIST_TRACKS, {
            db_playlist_id: playlistId,
            uris: trackUris
        });
    }

    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.pendingRequests.clear();
    }
}
