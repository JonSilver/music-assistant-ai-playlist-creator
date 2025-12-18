import type { TrackMatch, TrackSuggestion } from "../../../shared/types.js";

export const createUnmatchedTracks = (suggestions: TrackSuggestion[]): TrackMatch[] =>
    suggestions.map(suggestion => ({
        suggestion,
        matched: false,
        matching: true
    }));
