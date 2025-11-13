/**
 * Parse provider keywords from JSON string
 */

import { attempt } from "@jfdi/attempt";

/**
 * Parse provider keywords from settings JSON string
 * @param weightsStr - JSON string of provider keywords array
 * @returns Array of keyword strings, or empty array if invalid
 */
export const parseProviderKeywords = (weightsStr: string): string[] => {
    if (weightsStr === "") return [];
    const [err, parsed] = attempt(() => JSON.parse(weightsStr) as unknown);
    if (err !== undefined) return [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
};
