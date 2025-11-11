import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import { attemptPromise, attempt } from '@jfdi/attempt';
import type { AIProvider, AIPlaylistResponse } from '../../../shared/types.js';

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
    provider: AIProvider;
    apiKey: string;
    model?: string;
    baseUrl?: string;
    customSystemPrompt?: string;
    temperature?: number;
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
            ? `\n\nThe user's favorite artists include: ${favoriteArtists.join(', ')}.
When appropriate, consider including tracks from these artists or similar artists.`
            : '';

    const guidelinesSection =
        customPrompt === undefined
            ? (() => {
                  const countGuideline =
                      trackCount !== undefined && trackCount > 0
                          ? `- Create exactly ${trackCount} tracks`
                          : '- Create 15-30 tracks unless user specifies otherwise';

                  return `\n\nGuidelines:
${countGuideline}
- Ensure good flow and cohesion
- Match the mood, genre, and era requested
- Include artist and album information for better matching
- Be specific with track titles and artist names
- Consider the user's favorite artists when relevant`;
              })()
            : '';

    return basePrompt + favoriteArtistsSection + guidelinesSection;
};

const parseAIResponse = (content: string): AIPlaylistResponse => {
    const trimmedContent = content.trim();
    const jsonMatch = /```(?:json)?\s*(\{[\s\S]*\})\s*```/.exec(trimmedContent);
    const jsonContent = jsonMatch !== null ? jsonMatch[1] : trimmedContent;

    const [parseErr, data] = attempt(() => JSON.parse(jsonContent));
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

const generateWithClaude = async (request: AIPlaylistRequest): Promise<AIPlaylistResponse> => {
    const anthropic = new Anthropic({
        apiKey: request.apiKey,
        dangerouslyAllowBrowser: true
    });

    const systemPrompt = buildSystemPrompt(
        request.favoriteArtists,
        request.customSystemPrompt,
        request.trackCount
    );
    const temperature = request.temperature ?? 1.0;

    const [err, result] = await attemptPromise(async () => {
        const response = await anthropic.messages.create({
            model: request.model ?? 'claude-sonnet-4-5-20250929',
            max_tokens: 4096,
            temperature,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: request.prompt
                }
            ]
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Claude');
        }

        return parseAIResponse(content.text);
    });

    if (err !== undefined) {
        throw new Error(`Claude API error: ${err.message}`);
    }

    return result;
};

const generateWithOpenAI = async (request: AIPlaylistRequest): Promise<AIPlaylistResponse> => {
    const openai = new OpenAI({
        apiKey: request.apiKey,
        baseURL: request.baseUrl,
        dangerouslyAllowBrowser: true
    });

    const systemPrompt = buildSystemPrompt(
        request.favoriteArtists,
        request.customSystemPrompt,
        request.trackCount
    );
    const temperature = request.temperature ?? 1.0;

    const [err, result] = await attemptPromise(async () => {
        const response = await openai.chat.completions.create({
            model: request.model ?? 'gpt-4-turbo-preview',
            temperature,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: request.prompt }
            ],
            response_format: { type: 'json_object' }
        });

        const firstChoice = response.choices[0];
        if (firstChoice === null || firstChoice === undefined) {
            throw new Error('No choices in OpenAI response');
        }

        const content = firstChoice.message.content;
        if (content === null || content === undefined) {
            throw new Error('No response from OpenAI');
        }

        return parseAIResponse(content);
    });

    if (err !== undefined) {
        throw new Error(`OpenAI API error: ${err.message}`);
    }

    return result;
};

export const generatePlaylist = async (request: AIPlaylistRequest): Promise<AIPlaylistResponse> => {
    if (request.provider === 'claude') {
        return generateWithClaude(request);
    }
    return generateWithOpenAI(request);
};
