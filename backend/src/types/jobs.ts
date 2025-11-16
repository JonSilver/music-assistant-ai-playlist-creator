/**
 * Job tracking types for async playlist generation
 */

import type { TrackMatch } from "../../../shared/types.js";

export interface PlaylistGenerationJob {
    jobId: string;
    status:
        | "pending"
        | "generating_ai"
        | "matching_tracks"
        | "creating_playlist"
        | "completed"
        | "failed";
    prompt: string;
    providerPreference?: string;
    webhookUrl?: string;
    createdAt: Date;
    updatedAt: Date;

    // Progress tracking
    tracks?: TrackMatch[];
    totalTracks?: number;
    matchedTracks?: number;

    // Results
    playlistUrl?: string;
    playlistId?: string;
    tracksAdded?: number;

    // Errors
    error?: string;
}

export interface JobProgressUpdate {
    jobId: string;
    status: PlaylistGenerationJob["status"];
    tracks?: TrackMatch[];
    totalTracks?: number;
    matchedTracks?: number;
    playlistUrl?: string;
    error?: string;
}
