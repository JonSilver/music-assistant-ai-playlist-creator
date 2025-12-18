import { attempt, attemptPromise } from "@jfdi/attempt";
import { API_ENDPOINTS } from "@shared/constants";
import type {
    BackendGeneratePlaylistRequest,
    BackendGeneratePlaylistResponse,
    BackendJobProgressUpdate,
    BackendCreatePlaylistResponse,
    BackendRefinePlaylistResponse,
    BackendRetryTrackResponse,
    BackendReplaceTrackResponse,
    BackendTestMAResponse,
    TrackMatch
} from "@shared/types";
import { backendFetch, getBackendUrl } from "../utils/fetchUtils";

export const generatePlaylistViaBackend = async (
    request: BackendGeneratePlaylistRequest,
    onProgress: (update: BackendJobProgressUpdate) => void
): Promise<void> => {
    const startResponse = await backendFetch<BackendGeneratePlaylistResponse>(
        API_ENDPOINTS.PLAYLISTS_GENERATE,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request)
        }
    );

    const { jobId } = startResponse;
    const backendUrl = getBackendUrl();
    const streamUrl = `${backendUrl}${API_ENDPOINTS.PLAYLISTS_JOB_STREAM.replace(":jobId", jobId)}`;

    return new Promise((resolve, reject) => {
        const eventSource = new EventSource(streamUrl);

        eventSource.onmessage = (event: MessageEvent) => {
            const [parseErr, data] = attempt<unknown>(
                () => JSON.parse(event.data as string) as unknown
            );

            if (parseErr !== undefined) {
                console.error("Failed to parse SSE message:", parseErr);
                return;
            }

            const update = data as BackendJobProgressUpdate;
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
): Promise<BackendCreatePlaylistResponse> => {
    return backendFetch<BackendCreatePlaylistResponse>(API_ENDPOINTS.PLAYLISTS_CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistName, prompt, tracks })
    });
};

export const refinePlaylistViaBackend = async (
    refinementPrompt: string,
    currentTracks: TrackMatch[],
    providerPreference?: string
): Promise<TrackMatch[]> => {
    const result = await backendFetch<BackendRefinePlaylistResponse>(
        API_ENDPOINTS.PLAYLISTS_REFINE,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refinementPrompt, currentTracks, providerPreference })
        }
    );
    return result.tracks;
};

export const retryTrackViaBackend = async (
    track: TrackMatch,
    providerKeywords: string[] = []
): Promise<TrackMatch> => {
    const result = await backendFetch<BackendRetryTrackResponse>(
        API_ENDPOINTS.PLAYLISTS_TRACKS_RETRY,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track, providerKeywords })
        }
    );
    return result.track;
};

export const replaceTrackViaBackend = async (
    trackToReplace: TrackMatch,
    currentTracks: TrackMatch[],
    originalPrompt: string,
    playlistName: string,
    providerPreference?: string
): Promise<TrackMatch> => {
    const result = await backendFetch<BackendReplaceTrackResponse>(
        API_ENDPOINTS.PLAYLISTS_TRACKS_REPLACE,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                trackToReplace,
                currentTracks,
                originalPrompt,
                playlistName,
                providerPreference
            })
        }
    );
    return result.track;
};

export const testMusicAssistantConnection = async (
    musicAssistantUrl: string
): Promise<BackendTestMAResponse> => {
    const [err, result] = await attemptPromise(async () =>
        backendFetch<BackendTestMAResponse>(API_ENDPOINTS.PLAYLISTS_TEST_MA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ musicAssistantUrl })
        })
    );

    if (err !== undefined) 
        return { success: false, error: err.message };
    

    return result;
};
