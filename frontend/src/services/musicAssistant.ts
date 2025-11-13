import { attempt, attemptPromise } from "@jfdi/attempt";
import {
    ERROR_MESSAGES,
    LIMITS,
    MA_COMMANDS,
    MEDIA_TYPES,
    TIMEOUTS,
    WS_MESSAGE_PREFIX,
    WS_PATH
} from "@shared/constants";
import type { MATrack } from "@shared/types";

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
    private url: string;
    private pendingRequests = new Map<
        string,
        {
            resolve: (value: unknown) => void;
            reject: (error: Error) => void;
            timeout: number;
        }
    >();

    constructor(url: string) {
        this.url = url;
    }

    async connect(): Promise<void> {
        const wsUrl = this.url.replace(/^http/, "ws") + WS_PATH;

        const [err] = await attemptPromise(async () => {
            this.ws = new WebSocket(wsUrl);

            return new Promise<void>((resolve, reject) => {
                if (this.ws === null) {
                    reject(new Error(ERROR_MESSAGES.WS_NOT_INITIALIZED));
                    return;
                }

                this.ws.onopen = (): void => {
                    resolve();
                };
                this.ws.onerror = (err): void => {
                    reject(new Error(`WebSocket error: ${err.type}`));
                };
                this.ws.onmessage = (event): void => {
                    this.handleMessage(event.data as string);
                };
            });
        });

        if (err !== undefined) {
            throw new Error(`Failed to connect to Music Assistant: ${err.message}`);
        }
    }

    private handleMessage(data: string): void {
        const [parseErr, message] = attempt<MAResponse>(() => JSON.parse(data));
        if (parseErr !== undefined) {
            console.error("Failed to parse MA message:", parseErr);
            return;
        }

        if (message.message_id === null || message.message_id === undefined) {
            return;
        }

        const pending = this.pendingRequests.get(message.message_id);
        if (pending === null || pending === undefined) {
            return;
        }

        clearTimeout(pending.timeout);

        if (message.error !== null && message.error !== undefined) {
            pending.reject(new Error(message.error.message));
        } else {
            pending.resolve(message.result);
        }

        this.pendingRequests.delete(message.message_id);
    }

    private sendCommand<T>(command: string, params?: Record<string, unknown>): Promise<T> {
        if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error(ERROR_MESSAGES.WS_NOT_CONNECTED);
        }

        const currentMessageId = this.messageId;
        this.messageId = this.messageId + 1;
        const messageId = `${WS_MESSAGE_PREFIX}${currentMessageId}`;
        const message = {
            message_id: messageId,
            command,
            args: params ?? {}
        };

        const sendTime = performance.now();
        console.log(
            `[${new Date().toISOString()}] [MA WS] → ${command} (pending: ${this.pendingRequests.size}, state: ${this.ws.readyState})`,
            params
        );

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(messageId)) {
                    this.pendingRequests.delete(messageId);
                    const elapsed = performance.now() - sendTime;
                    const elapsedMs = Math.round(elapsed);
                    console.error(
                        `[${new Date().toISOString()}] [MA WS] ⏱️ Timeout after ${elapsedMs}ms: ${command}`
                    );
                    reject(new Error(`${ERROR_MESSAGES.REQUEST_TIMEOUT}: ${command}`));
                }
            }, TIMEOUTS.WS_COMMAND) as unknown as number;

            this.pendingRequests.set(messageId, {
                resolve: ((value: unknown) => {
                    const elapsed = performance.now() - sendTime;
                    const elapsedMs = Math.round(elapsed);
                    console.log(
                        `[${new Date().toISOString()}] [MA WS] ← ${command} (${elapsedMs}ms)`
                    );
                    resolve(value as T);
                }) as (value: unknown) => void,
                reject,
                timeout: timeoutId
            });

            const [sendErr] = attempt(() => {
                const ws = this.ws;
                if (ws === null) {
                    throw new Error("WebSocket is null");
                }
                ws.send(JSON.stringify(message));
            });

            if (sendErr !== null && sendErr !== undefined) {
                this.pendingRequests.delete(messageId);
                clearTimeout(timeoutId);
                console.error(
                    `[${new Date().toISOString()}] [MA WS] ❌ Send failed: ${command}`,
                    sendErr
                );
                reject(sendErr);
            }
        });
    }

    async searchTracks(
        trackName: string,
        artistName: string,
        limit = LIMITS.SEARCH_TRACKS
    ): Promise<MATrack[]> {
        const searchQuery = trackName;
        console.log("[MA Search] Searching:", { searchQuery, limit });

        const result = await this.sendCommand<MASearchResults>(MA_COMMANDS.SEARCH, {
            search_query: searchQuery,
            media_types: [MEDIA_TYPES.TRACK],
            artist: artistName,
            limit,
            library_only: false
        });

        console.log("[MA Search] Raw result:", result);

        if (result === null || result === undefined) {
            console.error("[MA Search] Result is null/undefined");
            return [];
        }

        const tracks = result.tracks ?? [];
        console.log("[MA Search] Parsed result:", {
            count: tracks.length,
            first3: tracks.slice(0, 3).map(t => ({
                name: t.name,
                artist: t.artists[0]?.name,
                provider: t.provider
            }))
        });

        return tracks;
    }

    async getFavoriteArtists(): Promise<string[]> {
        const [err, result] = await attemptPromise(async () => {
            const response = await this.sendCommand<MAFavoritesResponse>(MA_COMMANDS.FAVORITES, {
                media_type: MEDIA_TYPES.ARTIST
            });
            return response.items.map(item => item.name);
        });

        return err !== undefined ? [] : result;
    }

    async createPlaylist(name: string, providerInstance?: string): Promise<string> {
        const result = await this.sendCommand<MAPlaylist>(MA_COMMANDS.CREATE_PLAYLIST, {
            name,
            provider_instance: providerInstance
        });

        return result.item_id;
    }

    async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
        await this.sendCommand(MA_COMMANDS.ADD_PLAYLIST_TRACKS, {
            db_playlist_id: playlistId,
            uris: trackUris
        });
    }

    disconnect(): void {
        if (this.ws !== null) {
            this.ws.close();
            this.ws = null;
        }
        Array.from(this.pendingRequests.values()).forEach(pending => {
            clearTimeout(pending.timeout);
        });
        this.pendingRequests.clear();
    }
}
