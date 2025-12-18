/**
 * Sort Music Assistant tracks by provider keyword weights
 * Lower weight = higher priority
 */

import type { MATrack } from "../../../shared/types.js";

/**
 * Calculate weight for a provider string based on keyword matches
 * @param provider - The provider string from MA track
 * @param keywords - Ordered array of keywords (position = weight)
 * @returns Total weight (sum of all matching keyword weights), or Infinity if no matches
 */
const calculateProviderWeight = (provider: string, keywords: string[]): number => {
    if (keywords.length === 0) 
        return 0; // No weighting configured
    

    const providerLower = provider.toLowerCase();

    // Calculate total weight using reduce
    const totalWeight = keywords.reduce((sum, keyword, index) => {
        const keywordLower = keyword.toLowerCase();
        return providerLower.includes(keywordLower) ? sum + (index + 1) : sum;
    }, 0);

    return totalWeight > 0 ? totalWeight : Infinity;
};

/**
 * Sort tracks by provider preference using keyword-based weighting
 * @param tracks - Array of MA tracks to sort
 * @param keywords - Ordered array of provider keywords (first = highest priority)
 * @returns Sorted array (stable sort preserving original order for equal weights)
 */
export const sortByProviderWeight = (tracks: MATrack[], keywords: string[]): MATrack[] => {
    // If no keywords configured, return original order
    if (keywords.length === 0) 
        return tracks;
    

    // Create array with weights for stable sorting
    const tracksWithWeights = tracks.map((track, index) => ({
        track,
        weight: calculateProviderWeight(track.provider, keywords),
        originalIndex: index
    }));

    // Stable sort by weight (ascending), then by original index
    tracksWithWeights.sort((a, b) => {
        if (a.weight !== b.weight) 
            return a.weight - b.weight;
        
        return a.originalIndex - b.originalIndex;
    });

    return tracksWithWeights.map(item => item.track);
};
