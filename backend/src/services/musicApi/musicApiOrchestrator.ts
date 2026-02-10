/**
 * Orchestrates external music API calls across providers
 */

import { attemptPromise } from "@jfdi/attempt";
import type {
    ExternalTrack,
    MusicApiBlendConfig,
    MusicApiProviderConfig,
    TrackSuggestion
} from "../../../../shared/types.js";
import { LastfmProvider } from "./lastfmProvider.js";
import { MusicbrainzProvider } from "./musicbrainzProvider.js";
import type { IMusicApiProvider } from "./types.js";

const SEED_TRACK_COUNT = 5;

/** Build provider instances from config, filtering to enabled + available only */
export const createProviders = (
    providers: MusicApiProviderConfig[]
): IMusicApiProvider[] =>
    providers
        .filter(p => p.enabled)
        .map((p): IMusicApiProvider | undefined => {
            if (p.type === "lastfm" && p.apiKey !== undefined)
                return new LastfmProvider(p.apiKey);
            if (p.type === "musicbrainz")
                return new MusicbrainzProvider();
            return undefined;
        })
        .filter((p): p is IMusicApiProvider => p !== undefined && p.isAvailable());

/** Query a single provider for similar tracks to all seed tracks */
const queryProvider = async (
    provider: IMusicApiProvider,
    seeds: TrackSuggestion[]
): Promise<ExternalTrack[]> => {
    const results = await Promise.all(
        seeds.map(async (seed) => {
            const [err, tracks] = await attemptPromise(async () =>
                provider.getSimilarTracks(seed.artist, seed.title)
            );
            if (err !== undefined) {
                console.warn(
                    `[MAPI] ${provider.type} getSimilarTracks failed for "${seed.title}": ${err.message}`
                );
                return [];
            }
            return tracks;
        })
    );
    return results.flat();
};

/** Fetch external tracks from all enabled providers using AI tracks as seeds */
export const enrichPlaylist = async (
    aiTracks: TrackSuggestion[],
    _prompt: string,
    config: MusicApiBlendConfig
): Promise<ExternalTrack[]> => {
    if (!config.providers.some(p => p.enabled)) return [];

    const providers = createProviders(config.providers);
    console.log(`[MAPI] Created ${providers.length} available providers from ${config.providers.length} configured (enabled: ${config.providers.filter(p => p.enabled).map(p => p.type).join(', ') || 'none'})`);
    if (providers.length === 0) return [];

    const seeds = aiTracks.slice(0, SEED_TRACK_COUNT);
    if (seeds.length === 0) return [];

    const providerResults = await Promise.all(
        providers.map(async (provider) => {
            const [err, tracks] = await attemptPromise(async () =>
                queryProvider(provider, seeds)
            );
            if (err !== undefined) {
                console.warn(`[MAPI] ${provider.type} provider failed entirely: ${err.message}`);
                return [];
            }
            return tracks;
        })
    );

    return providerResults.flat();
};
