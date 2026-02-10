/**
 * Blends AI-generated tracks with external music API tracks
 * Supports three modes: supplement, enrich, replace
 */

import type {
    ExternalTrack,
    MusicApiBlendConfig,
    TrackSuggestion
} from "../../../../shared/types.js";

/** Normalise title+artist into a comparable key for deduplication */
export const normaliseTrackKey = (title: string, artist: string): string => {
    const normTitle = title
        .toLowerCase()
        .replace(/\(feat\..*?\)/gi, "")
        .replace(/[^a-z0-9]/g, "");
    const normArtist = artist
        .toLowerCase()
        .replace(/^the\s+/i, "")
        .replace(/[^a-z0-9]/g, "");
    return `${normTitle}::${normArtist}`;
};

/** Convert ExternalTrack to TrackSuggestion with source attribution */
const toSuggestion = (track: ExternalTrack): TrackSuggestion => ({
    title: track.title,
    artist: track.artist,
    album: track.album,
    source: track.source
});

/** Remove duplicates, preferring earlier entries (AI tracks first in most modes) */
const deduplicate = (tracks: TrackSuggestion[]): TrackSuggestion[] => {
    const seen = new Set<string>();
    return tracks.filter(track => {
        const key = normaliseTrackKey(track.title, track.artist);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/** Supplement: AI tracks first, then fill with unique external tracks */
const blendSupplement = (
    aiTracks: TrackSuggestion[],
    externalSuggestions: TrackSuggestion[],
    maxExternal: number
): TrackSuggestion[] => {
    const aiDeduped = deduplicate(aiTracks);
    const aiKeys = new Set(aiDeduped.map(t => normaliseTrackKey(t.title, t.artist)));
    const uniqueExternal = externalSuggestions
        .filter(t => !aiKeys.has(normaliseTrackKey(t.title, t.artist)))
        .slice(0, maxExternal);
    return [...aiDeduped, ...uniqueExternal];
};

/** Enrich: interleave external tracks among AI tracks */
const blendEnrich = (
    aiTracks: TrackSuggestion[],
    externalSuggestions: TrackSuggestion[],
    maxExternal: number
): TrackSuggestion[] => {
    const aiDeduped = deduplicate(aiTracks);
    const aiKeys = new Set(aiDeduped.map(t => normaliseTrackKey(t.title, t.artist)));
    const uniqueExternal = externalSuggestions
        .filter(t => !aiKeys.has(normaliseTrackKey(t.title, t.artist)))
        .slice(0, maxExternal);

    if (uniqueExternal.length === 0) return aiDeduped;

    // Insert one external track every N AI tracks
    const interval = Math.max(1, Math.floor(aiDeduped.length / (uniqueExternal.length + 1)));
    const result: TrackSuggestion[] = [];
    let extIdx = 0;

    for (let i = 0; i < aiDeduped.length; i++) {
        result.push(aiDeduped[i]);
        if ((i + 1) % interval === 0 && extIdx < uniqueExternal.length) {
            result.push(uniqueExternal[extIdx]);
            extIdx++;
        }
    }
    // Append any remaining external tracks
    while (extIdx < uniqueExternal.length) {
        result.push(uniqueExternal[extIdx]);
        extIdx++;
    }
    return result;
};

/** Replace: external tracks first, AI tracks as fallback for remaining slots */
const blendReplace = (
    aiTracks: TrackSuggestion[],
    externalSuggestions: TrackSuggestion[],
    maxExternal: number
): TrackSuggestion[] => {
    const externalDeduped = deduplicate(externalSuggestions).slice(0, maxExternal);
    if (externalDeduped.length >= maxExternal) return externalDeduped;

    // Fill remaining with AI tracks not already present
    const extKeys = new Set(externalDeduped.map(t => normaliseTrackKey(t.title, t.artist)));
    const aiFallback = aiTracks.filter(
        t => !extKeys.has(normaliseTrackKey(t.title, t.artist))
    );
    return [...externalDeduped, ...aiFallback];
};

/** Blend AI tracks with external API tracks according to config */
export const blendTracks = (
    aiTracks: TrackSuggestion[],
    externalTracks: ExternalTrack[],
    config: MusicApiBlendConfig
): TrackSuggestion[] => {
    if (externalTracks.length === 0) return aiTracks;

    const externalSuggestions = deduplicate(externalTracks.map(toSuggestion));
    const maxExternal = config.maxExternalTracks ?? 10;

    switch (config.blendMode) {
        case "supplement":
            return blendSupplement(aiTracks, externalSuggestions, maxExternal);
        case "enrich":
            return blendEnrich(aiTracks, externalSuggestions, maxExternal);
        case "replace":
            return blendReplace(aiTracks, externalSuggestions, maxExternal);
    }
};
