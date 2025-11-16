import { attemptPromise } from "@jfdi/attempt";
import { API_BASE_PATH, API_ENDPOINTS } from "@shared/constants";
import type { TrackMatch } from "@shared/types";

interface GeneratePlaylistRequest {
    prompt: string;
    providerPreference?: string;
}

interface GeneratePlaylistResponse {
    jobId: string;
}

interface JobProgressUpdate {
    jobId: string;
    status:
        | "pending"
        | "generating_ai"
        | "matching_tracks"
        | "creating_playlist"
        | "completed"
        | "failed";
    tracks?: TrackMatch[];
    totalTracks?: number;
    matchedTracks?: number;
    playlistUrl?: string;
    error?: string;
}

export const generatePlaylistViaBackend = async (
    request: GeneratePlaylistRequest,
    onProgress: (update: JobProgressUpdate) => void
): Promise<void> => {
    // Start generation
    const backendUrl =
        import.meta.env.MODE === "development"
            ? `http://localhost:3333${API_BASE_PATH}`
            : API_BASE_PATH;

    const [startErr, startResponse] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${API_ENDPOINTS.PLAYLISTS_GENERATE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            throw new Error(`Failed to start generation: ${response.statusText}`);
        }

        return response.json() as Promise<GeneratePlaylistResponse>;
    });

    if (startErr !== undefined) {
        throw new Error(`Failed to start playlist generation: ${startErr.message}`);
    }

    const { jobId } = startResponse;

    // Connect to SSE stream
    const streamUrl = `${backendUrl}${API_ENDPOINTS.PLAYLISTS_JOB_STREAM.replace(":jobId", jobId)}`;

    return new Promise((resolve, reject) => {
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = event => {
            const [parseErr, update] = attemptPromise<JobProgressUpdate>(async () =>
                JSON.parse(event.data)
            );

            if (parseErr !== undefined) {
                console.error("Failed to parse SSE message:", parseErr);
                return;
            }

            onProgress(update);

            if (update.status === "completed") {
                eventSource.close();
                resolve();
            } else if (update.status === "failed") {
                eventSource.close();
                reject(new Error(update.error ?? "Playlist generation failed"));
            }
        };

        eventSource.onerror = err => {
            console.error("SSE error:", err);
            eventSource.close();
            reject(new Error("Connection to server lost"));
        };
    });
};

export const createPlaylistViaBackend = async (
    playlistName: string,
    prompt: string,
    tracks: TrackMatch[]
): Promise<{ playlistId: string; playlistUrl: string; tracksAdded: number }> => {
    const backendUrl =
        import.meta.env.MODE === "development"
            ? `http://localhost:3333${API_BASE_PATH}`
            : API_BASE_PATH;

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${API_ENDPOINTS.PLAYLISTS_CREATE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ playlistName, prompt, tracks })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error ?? response.statusText);
        }

        return response.json() as Promise<{
            playlistId: string;
            playlistUrl: string;
            tracksAdded: number;
        }>;
    });

    if (err !== undefined) {
        throw new Error(`Failed to create playlist: ${err.message}`);
    }

    return result;
};

export const refinePlaylistViaBackend = async (
    refinementPrompt: string,
    currentTracks: TrackMatch[],
    providerPreference?: string
): Promise<TrackMatch[]> => {
    const backendUrl =
        import.meta.env.MODE === "development"
            ? `http://localhost:3333${API_BASE_PATH}`
            : API_BASE_PATH;

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${API_ENDPOINTS.PLAYLISTS_REFINE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ refinementPrompt, currentTracks, providerPreference })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error ?? response.statusText);
        }

        return response.json() as Promise<{ tracks: TrackMatch[] }>;
    });

    if (err !== undefined) {
        throw new Error(`Failed to refine playlist: ${err.message}`);
    }

    return result.tracks;
};

export const retryTrackViaBackend = async (
    track: TrackMatch,
    providerKeywords: string[] = []
): Promise<TrackMatch> => {
    const backendUrl =
        import.meta.env.MODE === "development"
            ? `http://localhost:3333${API_BASE_PATH}`
            : API_BASE_PATH;

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${API_ENDPOINTS.PLAYLISTS_TRACKS_RETRY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ track, providerKeywords })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error ?? response.statusText);
        }

        return response.json() as Promise<{ track: TrackMatch }>;
    });

    if (err !== undefined) {
        throw new Error(`Failed to retry track: ${err.message}`);
    }

    return result.track;
};

export const replaceTrackViaBackend = async (
    trackToReplace: TrackMatch,
    currentTracks: TrackMatch[],
    originalPrompt: string,
    playlistName: string,
    providerPreference?: string
): Promise<TrackMatch> => {
    const backendUrl =
        import.meta.env.MODE === "development"
            ? `http://localhost:3333${API_BASE_PATH}`
            : API_BASE_PATH;

    const [err, result] = await attemptPromise(async () => {
        const response = await fetch(`${backendUrl}${API_ENDPOINTS.PLAYLISTS_TRACKS_REPLACE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                trackToReplace,
                currentTracks,
                originalPrompt,
                playlistName,
                providerPreference
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(errorData.error ?? response.statusText);
        }

        return response.json() as Promise<{ track: TrackMatch }>;
    });

    if (err !== undefined) {
        throw new Error(`Failed to replace track: ${err.message}`);
    }

    return result.track;
};
