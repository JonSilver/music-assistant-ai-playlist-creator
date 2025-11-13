/**
 * Search and query limit values
 */

export const LIMITS = {
    /** Default search limit for tracks */
    SEARCH_TRACKS: 50,
    /** Max library tracks to fetch */
    LIBRARY_TRACKS: 1000,
    /** Prompt history limit */
    PROMPT_HISTORY: 50,
    /** Default track count for generated playlists */
    DEFAULT_TRACK_COUNT: 25,
    /** Batch size for processing */
    BATCH_SIZE: 10
};

// Default AI configuration
export const AI_DEFAULTS = {
    TEMPERATURE: 1.0,
    MIN_TEMPERATURE: 0,
    MAX_TEMPERATURE: 2
} as const;
