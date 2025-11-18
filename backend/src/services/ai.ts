import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";
import { attemptPromise, attempt } from "@jfdi/attempt";
import type { AIProviderConfig, AIPlaylistResponse } from "../../../shared/types.js";

const TrackSuggestionSchema = z.object({
    title: z.string(),
    artist: z.string(),
    album: z.string().optional()
});

const AIPlaylistResponseSchema = z.object({
    tracks: z.array(TrackSuggestionSchema),
    reasoning: z.string().optional()
});

interface AIPlaylistRequest {
    prompt: string;
    favoriteArtists?: string[];
    providerConfig: AIProviderConfig;
    customSystemPrompt?: string;
    trackCount?: number;
}

const buildSystemPrompt = (
    favoriteArtists?: string[],
    customPrompt?: string,
    trackCount?: number
): string => {
    const basePrompt =
        customPrompt ??
        `You are a music playlist curator assistant. Your job is to create thoughtful, cohesive playlists based on user descriptions.

CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do not include any text before or after the JSON. Do not use markdown code blocks. Do not add explanations. Start your response with { and end with }.

Required JSON format:
{
  "tracks": [
    {
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name"
    }
  ],
  "reasoning": "Brief explanation of playlist curation choices"
}`;

    const favoriteArtistsSection =
        favoriteArtists !== undefined && favoriteArtists.length > 0
            ? `\n\nThe user's favorite artists include: ${favoriteArtists.join(", ")}.
When appropriate, consider including tracks from these artists or similar artists.`
            : "";

    const guidelinesSection =
        customPrompt === undefined
            ? (() => {
                  const countGuideline =
                      trackCount !== undefined && trackCount > 0
                          ? `- Create exactly ${trackCount} tracks`
                          : "- Create 15-30 tracks unless user specifies otherwise";

                  return `\n\nGuidelines:
${countGuideline}
- Ensure good flow and cohesion
- Match the mood, genre, and era requested
- Include artist and album information for better matching
- Be specific with track titles and artist names
- Consider the user's favorite artists when relevant`;
              })()
            : "";

    return basePrompt + favoriteArtistsSection + guidelinesSection;
};

const parseAIResponse = (content: string): AIPlaylistResponse => {
    const trimmedContent = content.trim();
    const jsonMatch = /```(?:json)?\s*(\{[\s\S]*\})\s*```/.exec(trimmedContent);
    const jsonContent = jsonMatch !== null ? jsonMatch[1] : trimmedContent;

    const [parseErr, data] = attempt<unknown>(() => JSON.parse(jsonContent));
    if (parseErr !== undefined) {
        const preview = content.substring(0, 200);
        throw new Error(`Failed to parse AI response as JSON. Response start: ${preview}`);
    }

    const parseResult = AIPlaylistResponseSchema.safeParse(data);
    if (!parseResult.success) {
        throw new Error(`Invalid AI response structure: ${parseResult.error.message}`);
    }

    return parseResult.data;
};

const generateWithAnthropic = async (request: AIPlaylistRequest): Promise<AIPlaylistResponse> => {
    if (request.providerConfig.apiKey === undefined || request.providerConfig.apiKey.trim() === "") {
        throw new Error("API key required for Anthropic provider");
    }

    const anthropic = new Anthropic({
        apiKey: request.providerConfig.apiKey
    });

    const systemPrompt = buildSystemPrompt(
        request.favoriteArtists,
        request.customSystemPrompt,
        request.trackCount
    );
    const temperature = request.providerConfig.temperature ?? 1.0;

    const [err, result] = await attemptPromise(async () => {
        const response = await anthropic.messages.create({
            model: request.providerConfig.model,
            max_tokens: 4096,
            temperature,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: request.prompt
                }
            ]
        });

        const content = response.content[0];
        if (content.type !== "text") {
            throw new Error("Unexpected response type from Claude");
        }

        return parseAIResponse(content.text);
    });

    if (err !== undefined) {
        throw new Error(`Claude API error: ${err.message}`);
    }

    return result;
};

const generateWithOpenAICompatible = async (
    request: AIPlaylistRequest
): Promise<AIPlaylistResponse> => {
    const openai = new OpenAI({
        apiKey: request.providerConfig.apiKey ?? "not-required",
        baseURL: request.providerConfig.baseUrl
    });

    const systemPrompt = buildSystemPrompt(
        request.favoriteArtists,
        request.customSystemPrompt,
        request.trackCount
    );
    const temperature = request.providerConfig.temperature ?? 1.0;

    const [err, result] = await attemptPromise(async () => {
        const response = await openai.chat.completions.create({
            model: request.providerConfig.model,
            temperature,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: request.prompt }
            ],
            response_format: { type: "json_object" }
        });

        const firstChoice = response.choices[0];
        const content = firstChoice.message.content;
        if (content === null) {
            throw new Error("No response from OpenAI");
        }

        return parseAIResponse(content);
    });

    if (err !== undefined) {
        throw new Error(`OpenAI API error: ${err.message}`);
    }

    return result;
};

export const generatePlaylist = async (request: AIPlaylistRequest): Promise<AIPlaylistResponse> => {
    if (request.providerConfig.type === "anthropic") {
        return generateWithAnthropic(request);
    }
    return generateWithOpenAICompatible(request);
};
